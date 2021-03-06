import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
// import db from '../firebase'

//Vuex is state management pattern for our Application
//its centralized store for all component
//so basically we have all our component in one place so we dont duplicate and have clean code
Vue.use(Vuex);
//Declare Our Api url
axios.defaults.baseURL = "https://vuetodoapi.herokuapp.com/api";

//Declare Our Vuex Instance and Set to store variable
export const store = new Vuex.Store({
        //state: is one store for our application which means all data we have
        state: {
            token: localStorage.getItem('access_token') || null,
            //Loading
            loading: true,
            filter: 'all',//Default Filter
            todos: []
        },
        //getters: first all methods get 'state' as first parameter
        //its computed properties for our store
        getters: {
            loggedIn(state) {//For check if user has token
                return state.token !== null;
            },
            remainig(state) {//For Remaining Items
                return state.todos.filter(todo => !todo.completed).length
            },
            anyRemaining(state, getters) {//Check if there is Remaining Items
                return getters.remainig != 0;
            },
            todosFiltered(state) {//Filter Items
                if (state.filter == 'all') {
                    return state.todos;
                } else if (state.filter == 'active') {
                    return state.todos.filter(todo => !todo.completed)
                } else if (state.filter == 'completed') {
                    return state.todos.filter(todo => todo.completed)
                }
                return state.todos;
            },
            showClearCompletedButton(state) {//For Check to show Clear Complete Button
                return state.todos.filter(todo => todo.completed).length > 0
            }
        },
        //mutations: are similar to event again methods get 'state' as first parameter
        //also for call it from component we should use 'commit'
        mutations: {
            addTodo(state, todo) {
                state.todos.push({
                    id: todo.id,
                    title: todo.title,
                    completed: todo.completed,
                    timestamp: new Date(),
                    editing: todo.editing,
                })
            },
            clearCompleted(state) {
                state.todos = state.todos.filter(todo => !todo.completed)
            },
            updateFilter(state, filter) {
                state.filter = filter;
            },
            checkAll(state, checked) {
                state.todos.forEach((todo) => todo.completed = checked)
            },
            deleteTodo(state, id) {
                //Find Index of items and check with id passed to method
                const index = state.todos.findIndex((item) => item.id == id);
                if (index > 0) {
                    //Splice 1 Item
                    state.todos.splice(index, 1);
                }
            },
            updateTodo(state, todo) {
                //Check Items id with data Id passed to method
                const index = state.todos.findIndex((item) => item.id == todo.id);
                //splice 1 item
                state.todos.splice(index, 1, {
                    'id': todo.id,
                    'title': todo.title,
                    'completed': todo.completed,
                    'editing': todo.editing,
                })
            },
            //Get todos and bind to todos state
            retrieveTodos(state, todos) {
                state.todos = todos;
            },
            updateLoading(state, loading) {
                state.loading = loading;
            },
            retrieveToken(state, token) {
                state.token = token;
            },
            destroyToken(state) {
                state.token = null;
            },
            clearTodos(state) {
                state.todos = [];
            }
        },
        //actions: are same as mutations but is for task that take some time like Ajax and also for parameter we use context
        //also for call it from component we should use 'dispatch'
        actions: {
            retrieveName(context) {
                axios.defaults.headers.common['Authorization'] = 'Bearer ' + context.state.token;//Pass Header
                return new Promise((resolve, reject) => {
                    axios.get('/user').then(response => {
                        resolve(response)
                    }).catch(error => {
                        reject(error);
                    });
                });
            },
            clearTodos(context) {
                context.commit('clearTodos');
            },
            contact(context, data) {//Contact Form
                return new Promise((resolve, reject) => {
                    axios.post('/contact', {//Pass Data
                        name: data.name,
                        email: data.email,
                        message: data.message,
                    }).then(response => {
                        resolve(response)
                    }).catch(error => {
                        reject(error);
                    });
                });
            },
            register(context, data) {//Register User
                return new Promise((resolve, reject) => {
                    axios.post('/register', {//Pass Data
                        name: data.name,
                        email: data.email,
                        password: data.password,
                    }).then(response => {
                        resolve(response)
                    }).catch(error => {
                        reject(error);
                    });
                });
            },
            destroyToken(context) {//For Time When User Logout
                axios.defaults.headers.common['Authorization'] = 'Bearer ' + context.state.token;//Pass Header
                if (context.getters.loggedIn) {
                    return new Promise((resolve, reject) => {
                        axios.post('/logout').then(response => {
                            localStorage.removeItem('access_token');
                            context.commit('destroyToken');
                            resolve(response)
                        }).catch(error => {
                            localStorage.removeItem('access_token');
                            context.commit('destroyToken');
                            reject(error);
                        });
                    });
                }
            },
            retrieveToken(context, credentials) {
                return new Promise((resolve, reject) => {
                    axios.post('/login', {
                        username: credentials.username,
                        password: credentials.password,
                    })
                        .then(response => {
                            const token = response.data.access_token;

                            localStorage.setItem('access_token', token);
                            context.commit('retrieveToken', token);
                            resolve(response)
                        })
                        .catch(error => {
                            reject(error)
                        })
                })
            },
            // initRealtimeListeners(context) {
            //     db.collection('todos').onSnapshot(snapshot => {
            //         snapshot.docChanges().forEach(function (change) {
            //             if (change.type == 'added') {
            //                 const source = change.doc.metadata.hasPendingWrites ? "Local" : "Server";
            //                 if (source == 'Server') {
            //                     context.commit('addTodo', {
            //                         id: change.doc.id,
            //                         title: change.doc.data().title,
            //                         completed: false,
            //                     })
            //                 }
            //
            //             }
            //             if (change.type == 'modified') {
            //                 context.commit('updateTodo', {
            //                     id: change.doc.id,
            //                     title: change.doc.data().title,
            //                     completed: change.doc.data().completed,
            //                 })
            //             }
            //             if (change.type == 'removed') {
            //                 context.commit('deleteTodo', change.doc.id);
            //             }
            //         })
            //     });
            // },
            //Get All Tasks
            retrieveTodos(context) {
                axios.defaults.headers.common['Authorization'] = 'Bearer ' + context.state.token;//Pass Header
                context.commit('updateLoading', true);
                axios.get('/todos')
                    .then(response => {
                        context.state.loading = false;
                        //Pass Data to Mutations method 'retrieveTodos'
                        context.commit('retrieveTodos', response.data)
                    })
            },
            //Adding Todos
            addTodo(context, todo) {
                axios.post('/todos', {
                    title: todo.title,
                    completed: false,
                }).then(response => {
                    context.commit('addTodo', response.data)
                });
            },
            clearCompleted(context) {
                //Get All todos that has completed and also get Id
                const completed = context.state.todos
                    .filter(todo => todo.completed)
                    .map(todo => todo.id);

                axios.delete('/todosDeleteCompleted', {
                    data: {
                        todos: completed
                    }
                })
                    .then(response => {
                        context.commit('clearCompleted')
                    })
                    .catch(error => {
                        console.log(error)
                    })
            },
            updateFilter(context, filter) {
                context.commit('updateFilter', filter);
            },
            //Checked All Todos
            checkAll(context, checked) {
                axios.patch('/todosCheckAll', {
                    completed: checked
                }).then(response => {
                    context.commit('checkAll', checked);
                });
            },

            deleteTodo(context, id) {
                axios.delete('/todos/' + id)
                    .then(response => {
                        context.commit('deleteTodo', id)
                    });
            },
            //Update Todos
            updateTodo(context, todo) {
                axios.patch('/todos/' + todo.id, {
                    title: todo.title,
                    completed: todo.completed,
                })
                    .then(response => {
                        context.commit('updateTodo', response.data)
                    })
                    .catch(error => {
                        console.log(error)
                    })
            }
        }
    })
;