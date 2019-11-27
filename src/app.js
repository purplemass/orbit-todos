import { Schema, NetworkError } from "@orbit/data";
import IndexedDBSource from "@orbit/indexeddb";
import JSONAPISource from '@orbit/jsonapi';
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
      }
    },
    moon: {
      attributes: {
        name: { type: "string" }
      },
      relationships: {
        planet: { type: "hasOne", model: "planet", inverse: "moons" }
      }
    }
  }
});

const memory = new MemorySource({ schema });
const backup = new IndexedDBSource({
  schema,
  name: "backup",
  namespace: "solarsystem"
});
const remote = new JSONAPISource({
  schema,
  name: "remote",
  host: 'http://localhost:8000',
});
const coordinator = new Coordinator({
  sources: [memory, remote, backup, ]
});

window.memory = memory;
window.remote = remote;
window.coordinator = coordinator;

// coordinator.addStrategy(new EventLoggingStrategy());

const bobStrategy = new RequestStrategy({
  name: 'bob-strategy',

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

// const pushFailMemoryStrategy = new RequestStrategy({
//   name: "memory-push-fail",
//   source: "memory",
//   on: "push",
//   action() {
//     console.log('pushFailMemory');
//     this.source.requestQueue.skip();
//     setTimeout(() => this.source.requestQueue.retry(), 1000);
//   },
//   catch(e) {
//     console.log('MEMORY.QUERIED');
//   }
// });
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

coordinator.addStrategy(bobStrategy);
coordinator.addStrategy(pushFailStrategy);
// coordinator.addStrategy(pushFailMemoryStrategy);
coordinator.addStrategy(pullFailStrategy);

// Update the remote server whenever memory is updated
coordinator.addStrategy(new RequestStrategy({
  source: 'memory',
  on: 'beforeUpdate',
  target: 'remote',
  // action: 'push',
  blocking: true,
  action(transform, e) {
    console.log('gere');
    if (e instanceof NetworkError) {
      // this.source.requestQueue.skip();
      setTimeout(() => this.source.requestQueue.retry(), 5000);
    } else {
      this.target.push(transform).catch(() => {
      console.log('pop');
    });;
    }
  },
  catch(e) {
    console.log('memory.updated');
  }
}));

// Sync all changes received from the remote server to the memory
coordinator.addStrategy(new SyncStrategy({
  source: 'remote',
  target: 'memory',
  blocking: false,
  catch(e) {
    console.log('memory -> remote');
  }
}));

// Sync all changes received from memory to the remote server
coordinator.addStrategy(new SyncStrategy({
  source: 'memory',
  target: 'remote',
  blocking: false,
  catch(e) {
    console.log('remote -> memory');
  }
}));

// Back up data to IndexedDB
coordinator.addStrategy(new SyncStrategy({
  source: 'memory',
  target: 'backup',
  blocking: false,
  catch(e) {
    console.log('memory -> backup');
  }
}));

// let transform = await backup.pull(q => q.findRecords());

const loadData = async () => {

  // Restore data from IndexedDB upon launch
  const restore = backup.pull((q) => q.findRecords())
    .then((transform) => memory.sync(transform))
    .then(() => coordinator.activate())
    .then(() => {
      memory.query(q => q.findRecords("planet").sort("name"));
    });

  // let transform = await backup.pull(q => q.findRecords());
  // await memory.sync(transform);
  // await coordinator.activate();
};


(function() {
  loadData();
 })();

const addPlanets = async () => {
  await memory.update(t => [
    t.addRecord(venus),
    t.addRecord(earth),
    // t.addRecord(theMoon)
  ]);
}


/*
const planet = {
  type: "planet",
  id: "22",
  attributes: {
    name: "local",
    classification: "terrestrial",
    atmosphere: false
  }
};

await memory.update(t => t.addRecord(planet))
await memory.update(t => t.updateRecord(planet))

planets = await remote.query(q => q.findRecords("planet").sort("name"));
planets.forEach(p => console.log(p, p.id, p.attributes.name, p.attributes.classification))

planets = await memory.query(q => q.findRecords("planet").sort("name"));
planets.forEach(p => console.log(p, p.id, p.attributes.name, p.attributes.classification))
*/

/*
SET HEADER:
https://github.com/orbitjs/orbit/issues/454
remote.defaultFetchHeaders.Authorization = `Bearer ${json.token}`;
*/

/*
  action2: function(query, e) {
    console.log('=========> action');
    console.log(query);
    console.log(e);
    this.source.requestQueue.skip().catch((e) => {
      console.log('retry');
      console.log(e);
    });
  },

  action1(transform, e) {
    // console.log(transform);
    // console.log(e);
    if (e) {
      // setTimeout(() => this.source.requestQueue
      //   .retry().catch(e => console.log(e)), 1000);

      // this.source.requestQueue.retry().catch(e) => {
      //   console.log('retry');
      //   console.log(e);
      // };
      // this.target.push(transform).catch((e) => {
      //   console.log('Swallow all rejections.');
      //   console.log(e);
      // });
      // console.log('memory.queried');
      // console.log(this.target.syncQueue);
      // this.target.syncQueue.retry();
      // this.target.requestQueue.retry();
      // setTimeout(() => this.target.requestQueue.retry(), 500);
    }
  },
  */

// queryFail pushFail pullFail updateFail syncFail
