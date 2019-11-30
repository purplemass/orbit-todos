import Coordinator, { EventLoggingStrategy } from "@orbit/coordinator";
import IndexedDBSource from "@orbit/indexeddb";
import IndexedDBBucket from "@orbit/indexeddb-bucket";
import JSONAPISource from '@orbit/jsonapi';
import MemorySource from "@orbit/memory";
import { TaskQueue } from "@orbit/core";

import { keyMap, schema, CustomJSONAPISerializer } from "./schema"
import {
  remotePush,
  remotePushFail,
  remotePullFail,
  remoteMemorySync,
  memoryRemoteSync,
  memoryBackupSync,
} from "./strategies";


window.memory = new MemorySource({ schema, keyMap });
window.backup = new IndexedDBSource({
  schema,
  keyMap,
  name: "backup",
  namespace: "todos",
});
window.remote = new JSONAPISource({
  schema,
  keyMap,
  name: "remote",
  host: 'http://localhost:8000',
  SerializerClass: CustomJSONAPISerializer
});
window.coordinator = new Coordinator({
  sources: [memory, remote, backup, ]
});

const bucket = new IndexedDBBucket({ namespace: "remote-queue" });
window.queue = new TaskQueue(remote, { name: 'remote-queue', bucket, autoProcess: false });

// coordinator.addStrategy(new EventLoggingStrategy({
//   sources: ["remote"]
// }));

coordinator.addStrategy(remotePushFail);
coordinator.addStrategy(remotePush);
// coordinator.addStrategy(remotePullFail);

coordinator.addStrategy(remoteMemorySync);
coordinator.addStrategy(memoryRemoteSync);
coordinator.addStrategy(memoryBackupSync);

const loadData = async () => {

  const transform = await backup.pull(q => q.findRecords());
  await memory.sync(transform);
  // await memory.query(q => q.findRecords("planet").sort("name"));
  await coordinator.activate();
  // await remote.pull(q => q.findRecords('planet'));
};

loadData();

/*
SET HEADER:
https://github.com/orbitjs/orbit/issues/454
remote.defaultFetchHeaders.Authorization = `Bearer ${json.token}`;

ACTIONS:
queryFail pushFail pullFail updateFail syncFail

KEEP:
    const transforms = await remote.pull(q => q.findRecords('planet'));
    transforms.forEach(transform => {
      transform.operations.forEach(operation => {
        operation.record.id = operation.record.attributes.uuid;
      });
    });
    await memory.sync(transforms);
    refreshUI();

    backup.pull((q) => q.findRecords())
      .then((transform) => {
        transform.forEach(tr => {
          tr.operations.forEach(op => {
            console.log(op);
            if (op.op === 'addRecord') {
              console.log(op);
              console.log('addRecord');
              op.record.id = null;
            }
            // remote.push(op);
          })
        })
      })
      .then(() => refreshUI());

    remote.pull((q) => q.findRecords())
      .then((transform) => remote.sync(transform))
      // .then((transform) => console.log(transform))
      .then(() => refreshUI());

  memory.cache.on('patch', (operation) => {
    console.log(operation);
    if (operation.op === 'addRecord') {
      console.log('addRecord');
      operation.record.id = null;
    }
    return remote.push(operation)
  });

  // Restore data from IndexedDB upon launch
  const restore = backup.pull((q) => q.findRecords())
    .then((transform) => memory.sync(transform))
    .then(() => coordinator.activate())
    .then(() => {
      memory.query(q => q.findRecords("planet").sort("name"));
    });

    await coordinator.deactivate()
    // await coordinator.removeStrategy('some-strategy');
    // await coordinator.addStrategy(someStrategy);
    await coordinator.removeSource('remote');
    await coordinator.addSource(remote);
    await coordinator.activate();
*/
