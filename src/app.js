import { KeyMap } from "@orbit/data";
import IndexedDBSource from "@orbit/indexeddb";
import JSONAPISource, { JSONAPISerializer } from '@orbit/jsonapi';
import MemorySource from "@orbit/memory";
import { EventLoggingStrategy } from "@orbit/coordinator";

import Coordinator from "@orbit/coordinator";
import { schema } from "./schema"
import {
  someStrategy,
  remotePushFail,
  remotePullFail,
  memoryRemoteRequest,
  remoteMemorySync,
  memoryRemoteSync,
  memeryBackupSync,
} from "./strategies";


class CustomJSONAPISerializer extends JSONAPISerializer {
  resourceKey(type) {
    return 'remoteId';
  }
}

const keyMap = new KeyMap();
const memory = new MemorySource({ schema });
const backup = new IndexedDBSource({
  schema,
  name: "backup",
  namespace: "solarsystem"
});
const remote = new JSONAPISource({
  schema,
  keyMap,
  name: "remote",
  host: 'http://localhost:8000',
  SerializerClass: CustomJSONAPISerializer
});
const coordinator = new Coordinator({
  sources: [memory, remote, backup, ]
});

window.memory = memory;
window.backup = backup;
window.remote = remote;
window.coordinator = coordinator;

// coordinator.addStrategy(new EventLoggingStrategy({
//   sources: ["remote"]
// }));

// coordinator.addStrategy(someStrategy);
// coordinator.addStrategy(remotePushFail);
// coordinator.addStrategy(remotePullFail);
// coordinator.addStrategy(memoryRemoteRequest);

coordinator.addStrategy(remoteMemorySync);
coordinator.addStrategy(memoryRemoteSync);
coordinator.addStrategy(memeryBackupSync);

// let transform = await backup.pull(q => q.findRecords());

const loadData = async () => {

  // Restore data from IndexedDB upon launch
  // const restore = backup.pull((q) => q.findRecords())
  //   .then((transform) => memory.sync(transform))
  //   .then(() => coordinator.activate())
  //   .then(() => {
  //     memory.query(q => q.findRecords("planet").sort("name"));
  //   });
  const transform = await backup.pull(q => q.findRecords());
  await memory.sync(transform);
  await coordinator.activate();
  // await remote.pull(q => q.findRecords('planet'));
};

(function() {
  loadData();
})();

/*
SET HEADER:
https://github.com/orbitjs/orbit/issues/454
remote.defaultFetchHeaders.Authorization = `Bearer ${json.token}`;

ACTIONS:
queryFail pushFail pullFail updateFail syncFail

KEEP:
  // Restore data from IndexedDB upon launch
  const restore = backup.pull((q) => q.findRecords())
    .then((transform) => memory.sync(transform))
    .then(() => coordinator.activate())
    .then(() => {
      memory.query(q => q.findRecords("planet").sort("name"));
    });

  memory.cache.on('patch', (operation) => {
    console.log(operation);
    if (operation.op === 'addRecord') {
      console.log('addRecord');
      operation.record.id = null;
    }
    return remote.push(operation)
  });
*/
