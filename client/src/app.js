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
  remoteQueryFail,
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
  // host: 'http://localhost:8000',
  host: 'https://jamshift.com/api',
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
coordinator.addStrategy(remoteQueryFail);
coordinator.addStrategy(remotePush);
coordinator.addStrategy(remoteMemorySync);
coordinator.addStrategy(memoryRemoteSync);
coordinator.addStrategy(memoryBackupSync);

const loadData = async () => {

  const transform = await backup.pull(q => q.findRecords());
  await memory.sync(transform);
  // await memory.query(q => q.findRecords("todo").sort("name"));
  await coordinator.activate();
  // await remote.pull(q => q.findRecords('todo'));
};

const loadServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
    .then((reg) => {
      console.log('service worker scope: ' + reg.scope);
    }).catch((error) => {
      console.log('Could not register service worker', error);
    });
  }
}

// loadServiceWorker();
loadData();
