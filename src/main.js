// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import VueRouter from 'vue-router'
import Master from "./components/layouts/Master";
import {store} from './store/store'
import routes from "./routes";
import CxltToastr from 'cxlt-vue2-toastr';

const toastrConfigs = {
    position: 'top right',
    showDuration: 2000,
    timeout: 5000,
    progressBar: true,
};

//Event Bus: Allows All Component to communicate and not limit to Parent child
window.eventBus = new Vue();

Vue.config.productionTip = false;
Vue.use(VueRouter);
Vue.use(CxltToastr);
Vue.use(CxltToastr, toastrConfigs);

const router = new VueRouter({
    routes,
    mode: 'history'
});

router.beforeEach((to, from, next) => {
    if (to.matched.some(record => record.meta.requiresAuth)) {
        // this route requires auth, check if logged in
        // if not, redirect to login page.
        if (!store.getters.loggedIn) {
            next({
                name: 'login',
            })
        } else {
            next()
        }
    } else if (to.matched.some(record => record.meta.requiresVisitor)) {
        // this route not requires auth, check if logged in redirect to task page.
        if (store.getters.loggedIn) {
            next({
                name: 'todo',
            })
        } else {
            next()
        }
    } else {
        next() // make sure to always call next()!
    }
});

/* eslint-disable no-new */
new Vue({
    el: '#app',
    router: router,
    store: store,
    components: {Master},
    template: '<Master/>'
});
