
(function() {

  'use strict';

  const ENTER_KEY = 13;
  var CREATE = false;
  var initialised = false;
  const newTodoDom = document.getElementById('new-todo');
  const todosDom = document.getElementById('todo-list');
  const userNameDom = document.getElementById('username');

  addEventListeners();
  setTimeout(() => refreshUI(), 100);

  function refresh() {
    todosDom.innerHTML = '';
  }

  function purge() {
    localStorage.removeItem('gun/');
    localStorage.removeItem('gun/gun/');
  }

  function addEventListeners() {
    newTodoDom.addEventListener('keypress', newTodoKeyPressHandler, false);
    document.getElementById('syncIt').addEventListener('click', () => syncIt(this));
    document.getElementById('deactivate').addEventListener('click', () => deactivate(this));
    document.getElementById('refreshUI').addEventListener('click', () => refreshUI(this));
    // document.getElementById('purge').addEventListener('click', purge.bind(this));
  }

  // -------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------

  const syncIt = async () => {
    const planets = await remote.query(q => q.findRecords("planet").sort("name"));
    console.log("remote:", planets.length);
    if (planets) refresh();
    planets
      // .map(p => ({...p, id: p.attributes.uuid}))
      .forEach(p => UI(p));

    // const transforms = await remote.pull(q => q.findRecords('planet'));
    // transforms.forEach(transform => {
    //   transform.operations.forEach(operation => {
    //     operation.record.id = operation.record.attributes.uuid;
    //   });
    // });
    // await memory.sync(transforms);
    // refreshUI();

    // const planets = await remote.query(q => q.findRecords("planet").sort("name"));
    // console.log("remote:", planets.length);
    // if (planets) refresh();
    // planets.forEach(p => UI(p));

    // backup.pull((q) => q.findRecords())
    //   .then((transform) => {
    //     transform.forEach(tr => {
    //       tr.operations.forEach(op => {
    //         console.log(op);
    //         if (op.op === 'addRecord') {
    //           console.log(op);
    //           console.log('addRecord');
    //           op.record.id = null;
    //         }
    //         // remote.push(op);
    //       })
    //     })
    //   })
    //   .then(() => refreshUI());
    // remote.pull((q) => q.findRecords())
    //   .then((transform) => remote.sync(transform))
    //   // .then((transform) => console.log(transform))
    //   // .then(() => refreshUI());
  };

  const refreshUI = async () => {
    // console.clear();
    refresh();
    let planets = await memory.query(q => q.findRecords("planet").sort("name"));
    console.log("memory:", planets.length);
    planets.forEach(p => UI(p));

    // planets = await remote.query(q => q.findRecords("planet").sort("name"));
    // console.log("remote:", planets.length);
    // if (planets) refresh();
    // planets.forEach(p => UI(p));
  }

  const deactivate = async() => {
    console.log('p');
    await coordinator.deactivate()

    // await coordinator.removeStrategy('bob-strategy');
    // await coordinator.addStrategy(bobStrategy);

    await coordinator.removeSource('remote');
    await coordinator.addSource(remote);

    await coordinator.activate();
  }


  const addTodo = async (text) => {
    const todo = {
      type: "planet",
      attributes: {
        name: text,
        classification: "terrestrial",
        atmosphere: true
      }
    };
    // todo.attributes.uuid = todo.id;
    await memory.update(t => t.addRecord(todo))
    refreshUI();
  }

  const deleteButtonPressed = async (todo) => {
    document.getElementById('li_' + todo.id).style.display = "none";
    console.log(todo);
    await memory.update(t => t.removeRecord(todo))
  }

  const checkboxChanged = async (todo, event) => {
    todo.attributes.atmosphere = event.target.checked;
    await memory.update(t => t.updateRecord(todo));
  }

  const todoBlurred = async (todo, event) => {
    console.log('todoBlurred', todo);
    const trimmedText = event.target.value.trim();
    if (!trimmedText) {
      deleteButtonPressed(todo);
    } else {
      todo.attributes.name = trimmedText;
      await memory.update(t => t.updateRecord(todo));
    }
  }

  // -------------------------------------------------------------------
  // UI Actions
  // -------------------------------------------------------------------

  function todoKeyPressed(todo) {
    if (event.keyCode === ENTER_KEY) {
      const inputEditTodo = document.getElementById('input_' + todo.id);
      inputEditTodo.blur();
    }
  }

  function newTodoKeyPressHandler( event ) {
    if (event.keyCode === ENTER_KEY) {
      addTodo(newTodoDom.value);
      newTodoDom.value = '';
    }
  }

  // User has double clicked a todo, display an input so they can edit the name
  function todoDblClicked(todo) {
    var div = document.getElementById('li_' + todo.id);
    var inputEditTodo = document.getElementById('input_' + todo.id);
    div.className = 'editing';
    inputEditTodo.focus();
  }

  // -------------------------------------------------------------------

  function UI(todo, id) {
    if (todo) {
      todosDom.appendChild(createTodoListItem(todo));
    }
  }

  function redrawTodosUI(todos) {
    todosDom.innerHTML = '';
    todos.forEach(function(todo) {
      // console.log(todo);
      todosDom.appendChild(createTodoListItem(todo));
    });
  }

  function createTodoListItem(todo) {
    var checkbox = document.createElement('input');
    checkbox.className = 'toggle';
    checkbox.type = 'checkbox';
    checkbox.addEventListener('change', checkboxChanged.bind(this, todo));

    var label = document.createElement('label');
    label.appendChild( document.createTextNode(todo.attributes.name));
    let remoteId = '';
    if (todo.keys) remoteId = todo.keys.remoteId;
    let copy = '<strong>' + todo.attributes.name + '</strong>';
    copy += ' ';
    copy += '<small>' + todo.id + '</small>';
    copy += ' | ';
    copy += '<small>' + remoteId + '</small>';
    // copy += ' | ';
    // copy += '<small>' + remoteId + '</small>';
    label.innerHTML = copy;
    label.addEventListener('dblclick', todoDblClicked.bind(this, todo));

    var deleteLink = document.createElement('button');
    deleteLink.className = 'destroy';
    deleteLink.addEventListener( 'click', deleteButtonPressed.bind(this, todo));

    var divDisplay = document.createElement('div');
    divDisplay.className = 'view';
    divDisplay.appendChild(checkbox);
    divDisplay.appendChild(label);
    divDisplay.appendChild(deleteLink);

    var inputEditTodo = document.createElement('input');
    inputEditTodo.id = 'input_' + todo.id;
    inputEditTodo.className = 'edit';
    inputEditTodo.value = todo.attributes.name;
    inputEditTodo.addEventListener('keypress', todoKeyPressed.bind(this, todo));
    inputEditTodo.addEventListener('blur', todoBlurred.bind(this, todo));

    var li = document.createElement('li');
    li.id = 'li_' + todo.id;
    li.appendChild(divDisplay);
    li.appendChild(inputEditTodo);

    if (todo.attributes.atmosphere) {
      li.className += 'complete';
      checkbox.checked = true;
    }

    return li;
  }

})();
