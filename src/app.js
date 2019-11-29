import { KeyMap, NetworkError, Schema } from "@orbit/data";
import IndexedDBSource from "@orbit/indexeddb";
import JSONAPISource, { JSONAPISerializer } from '@orbit/jsonapi';
import MemorySource from "@orbit/memory";
import { EventLoggingStrategy } from "@orbit/coordinator";

import Coordinator, { RequestStrategy, SyncStrategy } from "@orbit/coordinator";

const schema = new Schema({
  models: {
    planet: {
      attributes: {
        uuid: { type: "string" },
        name: { type: "string" },
        classification: { type: "string" },
        atmosphere: { type: "boolean" }
      },
      relationships: {
        moons: { type: "hasMany", model: "moon", inverse: "planet" }
      },
      keys: {
        remoteId: { type: "string" }
      }
    },
    moon: {
      attributes: {
        name: { type: "string" }
      },
      relationships: {
        planet: { type: "hasOne", model: "planet", inverse: "moons" }
      },
      keys: {
        remoteId: { type: "string" }
      }
    }
  }
});

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

// coordinator.addStrategy(new EventLoggingStrategy());

const someStrategy = new RequestStrategy({
  name: 'some-strategy',
  source: 'memory',
  on: 'beforeQuery',
  target: 'remote',
  action: 'query',
  blocking: false,

  catch(e) {
    console.log('memory.queried');
    if (e instanceof NetworkError) {
      console.log('NetworkError');
      // this.target.requestQueue.skip();
      this.target.syncQueue.skip();
    }
  }
});

const pushFailStrategy = new RequestStrategy({
  name: "remote-push-fail",
  source: "remote",
  on: "pushFail",
  action(transform, e) {
    console.log('pushFail');
    if (e instanceof NetworkError) {
      // this.source.requestQueue.skip();
      setTimeout(() => this.source.requestQueue.retry(), 5000);
    }
  },
  catch(e) {
    console.log('pushFailStrategy');
  }
});
const pullFailStrategy = new RequestStrategy({
  name: "remote-pull-fail",
  source: "remote",
  on: "pullFail",
  action() {
    console.log('pullFail');
    this.source.requestQueue.skip();
  },
  catch(e) {
    console.log('pullFailStrategy');
  }
});

// Update the remote server whenever memory is updated
const memoryRemoteStrategy = new RequestStrategy({
  source: 'memory',
  on: 'beforeUpdate',
  target: 'remote',
  // action: 'push',
  blocking: true,
  action(transform, e) {
    console.log('action.push');
    if (e instanceof NetworkError) {
      // this.source.requestQueue.skip();
      setTimeout(() => this.source.requestQueue.retry(), 5000);
    } else {
      transform.operations.forEach(operation => {
        if (operation.op === 'addRecord') {
          operation.record.attributes.uuid = operation.record.id;
        }
      });
      this.target.push(transform).catch(() => {
        console.log('Error when pushing');
    });
    }
  },
  catch(e) {
    console.log('memoryRemoteStrategy');
  }
});

// Sync all changes received from the remote server to the memory
coordinator.addStrategy(new SyncStrategy({
  source: 'remote',
  target: 'memory',
  blocking: true,
  catch(e) {
    console.log('remote -> memory');
  }
}));

// Sync all changes received from memory to the remote server
coordinator.addStrategy(new SyncStrategy({
  source: 'memory',
  target: 'remote',
  blocking: false,
  catch(e) {
    console.log('memory -> remote');
  }
}));

// Back up data to IndexedDB
coordinator.addStrategy(new SyncStrategy({
  source: 'memory',
  target: 'backup',
  blocking: false,
  action(transform, e) {
    console.log('ppp');
    this.target.sync(transform).catch(() => {
      console.log('Error when pushing');
    });
  },
  catch(e) {
    console.log('memory -> backup');
  }
}));

// coordinator.addStrategy(someStrategy);
coordinator.addStrategy(pushFailStrategy);
coordinator.addStrategy(pullFailStrategy);
// coordinator.addStrategy(pushFailMemoryStrategy);
coordinator.addStrategy(memoryRemoteStrategy);

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
