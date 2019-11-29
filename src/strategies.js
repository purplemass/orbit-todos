import { NetworkError } from "@orbit/data";
import { RequestStrategy, SyncStrategy } from "@orbit/coordinator";


export const someStrategy = new RequestStrategy({
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

export const remotePushFail = new RequestStrategy({
  name: "remote-push-fail",
  source: "remote",
  on: "pushFail",
  action(transform, e) {
    console.log('remotePushFail');
    if (e instanceof NetworkError) {
      // this.source.requestQueue.skip();
      setTimeout(() => this.source.requestQueue.retry(), 5000);
    }
  },
  catch(e) {
    console.error('remotePushFail: error');
  }
});
export const remotePullFail = new RequestStrategy({
  name: "remote-pull-fail",
  source: "remote",
  on: "pullFail",
  action() {
    console.log('remotePullFail');
    this.source.requestQueue.skip();
  },
  catch(e) {
    console.error('remotePullFail: error');
  }
});

// Update the remote server whenever memory is updated
export const memoryRemoteRequest = new RequestStrategy({
  name: "memory-remote-request",
  source: 'memory',
  on: 'beforeUpdate',
  target: 'remote',
  // action: 'push',
  blocking: true,
  action(transform, e) {
    console.log('memoryRemoteRequest');
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
        console.error('memoryRemoteRequest: error when pushing');
    });
    }
  },
  catch(e) {
    console.error('memoryRemoteRequest: error');
  }
});

// Sync all changes received from the remote server to the memory
export const remoteMemorySync = new SyncStrategy({
  name: "remote-memory-sync",
  source: 'remote',
  target: 'memory',
  blocking: true,
  action: 'push',
  actionRemoved(transform, e) {
    console.log('remoteMemorySync');
    this.target.sync(transform).catch(() => {
      console.error('remoteMemorySync: error when syncing');
    });
  },
  catch(e) {
    console.error('remoteMemorySync: error');
  }
});

// Sync all changes received from memory to the remote server
export const memoryRemoteSync = new SyncStrategy({
  name: "memory-remote-sync",
  source: 'memory',
  target: 'remote',
  blocking: true,
  // action: 'push',
  actionRemoved(transform, e) {
    console.log('memoryRemoteSync');
    this.source.sync(transform).catch(() => {
      console.error('memoryRemoteSync: error when syncing');
    });
  },
  catch(e) {
    console.error('memoryRemoteSync: error');
  }
});

// Back up data to IndexedDB
export const memeryBackupSync = new SyncStrategy({
  name: "memory-backup-sync",
  source: 'memory',
  target: 'backup',
  blocking: false,
  // action(transform, e) {
  //   console.log('memeryBackupSync');
  //   this.target.sync(transform).catch(() => {
  //     error.log('memeryBackupSync: error when syncing');
  //   });
  // },
  catch(e) {
    console.error('memeryBackupSync: error');
  }
});
