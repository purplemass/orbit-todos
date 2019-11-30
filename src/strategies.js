import { ClientError, NetworkError } from "@orbit/data";
import { RequestStrategy, SyncStrategy } from "@orbit/coordinator";


// Update the remote server whenever memory is updated
export const remotePush = new RequestStrategy({
  name: "remote-push-request",
  source: 'memory',
  on: 'beforeUpdate',
  target: 'remote',
  action: 'push',
  blocking: true,
  catch(e) {
    // errors caught by remotePushFail
  }
});

export const remotePushFail = new RequestStrategy({
  name: "remote-push-fail",
  source: "remote",
  on: "pushFail",
  action(transform, e) {
    console.log('remotePushFail');
    if (e instanceof ClientError) {
      console.log('skip task');
      this.source.requestQueue.skip();
    }
    if (e instanceof NetworkError) {
      console.log('add task to queue');
      if (this.source.requestQueue.current) {
        queue.push(this.source.requestQueue.current);
      }
      this.source.requestQueue.skip();
    }
  },
  catch(e) {
    console.log('remotePushFail: error');
  }
});

export const remotePullFail = new RequestStrategy({
  name: "remote-pull-fail",
  source: "remote",
  on: "pullFail",
  action(transform, e) {
    console.log('remotePullFail');
    if (e instanceof ClientError) {
      console.log('skip task');
      this.source.requestQueue.skip();
    }
    if (e instanceof NetworkError) {
      console.log('retry');
      setTimeout(() => this.source.requestQueue.retry(), 5000);
    }
  },
  catch(e) {
    console.log('remotePullFail: error');
  }
});

// Sync all changes received from the remote server to the memory
export const remoteMemorySync = new SyncStrategy({
  name: "remote-memory-sync",
  source: 'remote',
  target: 'memory',
  blocking: true,
  actionRemoved(transform, e) {
    console.log('remoteMemorySync');
    this.target.sync(transform).catch(() => {
      console.log('remoteMemorySync: error when syncing');
    });
  },
  catch(e) {
    console.log('remoteMemorySync: error');
  }
});

// Sync all changes received from memory to the remote server
export const memoryRemoteSync = new SyncStrategy({
  name: "memory-remote-sync",
  source: 'memory',
  target: 'remote',
  blocking: true,
  actionRemoved(transform, e) {
    console.log('memoryRemoteSync');
    this.source.sync(transform).catch(() => {
      console.log('memoryRemoteSync: error when syncing');
    });
  },
  catch(e) {
    console.log('memoryRemoteSync: error');
  }
});

// Back up data to IndexedDB
export const memoryBackupSync = new SyncStrategy({
  name: "memory-backup-sync",
  source: 'memory',
  target: 'backup',
  blocking: false,
  actionRemoved(transform, e) {
    console.log('memoryBackupSync');
    this.target.sync(transform).catch(() => {
      error.error('memoryBackupSync: error when syncing');
    });
  },
  catch(e) {
    console.log('memoryBackupSync: error');
  }
});

// Untested strategy
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
