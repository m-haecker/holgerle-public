
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/navbar/Navbar.svelte generated by Svelte v3.38.2 */

    const file$9 = "src/components/navbar/Navbar.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (31:4) {#each items as item}
    function create_each_block(ctx) {
    	let li;
    	let a;
    	let t0_value = /*item*/ ctx[1].label + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(a, "class", "nav-link svelte-o7mgqf");
    			attr_dev(a, "href", /*item*/ ctx[1].url);
    			add_location(a, file$9, 32, 6, 1033);
    			attr_dev(li, "class", "nav-item");
    			attr_dev(li, "data-toggle", "collapse");
    			attr_dev(li, "data-target", ".navbar-collapse.show");
    			add_location(li, file$9, 31, 5, 946);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t0);
    			append_dev(li, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(31:4) {#each items as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let section;
    	let nav;
    	let a;
    	let t1;
    	let button;
    	let span;
    	let t2;
    	let div;
    	let ul;
    	let each_value = /*items*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			nav = element("nav");
    			a = element("a");
    			a.textContent = "Catharin & Holger";
    			t1 = space();
    			button = element("button");
    			span = element("span");
    			t2 = space();
    			div = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(a, "class", "navbar-brand svelte-o7mgqf");
    			attr_dev(a, "href", "#welcome");
    			add_location(a, file$9, 14, 2, 507);
    			attr_dev(span, "class", "navbar-toggler-icon");
    			add_location(span, file$9, 25, 3, 774);
    			attr_dev(button, "class", "navbar-toggler");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "data-toggle", "collapse");
    			attr_dev(button, "data-target", "#navbarNav");
    			attr_dev(button, "aria-controls", "navbarNav");
    			attr_dev(button, "aria-expanded", "false");
    			attr_dev(button, "aria-label", "Toggle navigation");
    			add_location(button, file$9, 16, 2, 574);
    			attr_dev(ul, "class", "navbar-nav ml-auto svelte-o7mgqf");
    			add_location(ul, file$9, 29, 3, 883);
    			attr_dev(div, "class", "collapse navbar-collapse");
    			attr_dev(div, "id", "navbarNav");
    			add_location(div, file$9, 28, 2, 826);
    			attr_dev(nav, "class", "navbar navbar-expand-lg navbar-light bg-light svelte-o7mgqf");
    			add_location(nav, file$9, 13, 1, 445);
    			attr_dev(section, "id", "nav-bar");
    			attr_dev(section, "class", "svelte-o7mgqf");
    			add_location(section, file$9, 12, 0, 421);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, nav);
    			append_dev(nav, a);
    			append_dev(nav, t1);
    			append_dev(nav, button);
    			append_dev(button, span);
    			append_dev(nav, t2);
    			append_dev(nav, div);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*items*/ 1) {
    				each_value = /*items*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Navbar", slots, []);

    	const items = [
    		{
    			id: 0,
    			url: "#welcome",
    			label: "Begrüßung"
    		},
    		{ id: 1, url: "#schedule", label: "Ablauf" },
    		{
    			id: 2,
    			url: "#location",
    			label: "Location"
    		},
    		{
    			id: 3,
    			url: "#sleep",
    			label: "Übernachten"
    		},
    		{
    			id: 4,
    			url: "#response",
    			label: "Rückmeldung"
    		},
    		{ id: 5, url: "#gifts", label: "Präsente" },
    		{ id: 6, url: "#news", label: "News" }
    	]; // TODO: Fotos

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ items });
    	return [items];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    function getCookieValue(cookieName) {
        try {
            const cookieValue = document.cookie
                .split('; ')
                .find(row => row.startsWith(cookieName))
                .split('=')[1];
            return cookieValue;
        }
        catch (ignore) {
            return undefined;
        }
    }
    function setCookie(cookieName, val) {
        document.cookie = `${cookieName}=${val}; SameSite=Strict; max-age=31536000`; // max age = 1 year
    }

    const USER_INFO = 'userInfo'; // cookie name
    // const server = 'http://localhost:3000/'; // TODO
    const server = 'https://agile-springs-79186.herokuapp.com/';
    const ENDPOINT = {
        ping: `${server}ping`,
        login: `${server}login`,
        respond: `${server}respond`,
    };

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const user = writable(null);

    /* src/components/footer/Footer.svelte generated by Svelte v3.38.2 */
    const file$8 = "src/components/footer/Footer.svelte";

    function create_fragment$9(ctx) {
    	let section;
    	let img;
    	let img_src_value;
    	let t0;
    	let div5;
    	let div4;
    	let div0;
    	let p0;
    	let t2;
    	let div1;
    	let p1;
    	let t4;
    	let p2;
    	let t5;
    	let br0;
    	let t6;
    	let br1;
    	let t7;
    	let t8;
    	let div2;
    	let p3;
    	let t10;
    	let p4;
    	let i0;
    	let t11;
    	let a0;
    	let t13;
    	let p5;
    	let i1;
    	let t14;
    	let a1;
    	let t16;
    	let div3;
    	let t17;
    	let i2;
    	let br2;
    	let t19;
    	let a2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			section = element("section");
    			img = element("img");
    			t0 = space();
    			div5 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Impressum";
    			t2 = space();
    			div1 = element("div");
    			p1 = element("p");
    			p1.textContent = "Angaben gemäß § 5 TMG";
    			t4 = space();
    			p2 = element("p");
    			t5 = text("Holger Freudenberger");
    			br0 = element("br");
    			t6 = text("Am Schafgarten 7");
    			br1 = element("br");
    			t7 = text("74906 Bad Rappenau");
    			t8 = space();
    			div2 = element("div");
    			p3 = element("p");
    			p3.textContent = "Kontakt";
    			t10 = space();
    			p4 = element("p");
    			i0 = element("i");
    			t11 = space();
    			a0 = element("a");
    			a0.textContent = "+49 (0) 173 8370427";
    			t13 = space();
    			p5 = element("p");
    			i1 = element("i");
    			t14 = space();
    			a1 = element("a");
    			a1.textContent = "holger.freudenberger@freenet.de";
    			t16 = space();
    			div3 = element("div");
    			t17 = text("Angemeldet als ");
    			i2 = element("i");
    			i2.textContent = `${/*user*/ ctx[0].username}`;
    			br2 = element("br");
    			t19 = space();
    			a2 = element("a");
    			a2.textContent = "Abmelden";
    			if (img.src !== (img_src_value = "images/wave2.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "wave-img svelte-4pkn41");
    			add_location(img, file$8, 12, 1, 417);
    			attr_dev(p0, "class", "title svelte-4pkn41");
    			add_location(p0, file$8, 17, 4, 558);
    			attr_dev(div0, "class", "col-lg-3");
    			add_location(div0, file$8, 16, 3, 531);
    			attr_dev(p1, "class", "title svelte-4pkn41");
    			add_location(p1, file$8, 21, 4, 630);
    			add_location(br0, file$8, 23, 25, 706);
    			add_location(br1, file$8, 23, 47, 728);
    			add_location(p2, file$8, 22, 4, 677);
    			attr_dev(div1, "class", "col-lg-3");
    			add_location(div1, file$8, 20, 3, 603);
    			attr_dev(p3, "class", "title svelte-4pkn41");
    			add_location(p3, file$8, 28, 4, 803);
    			attr_dev(i0, "class", "fas fa-phone");
    			add_location(i0, file$8, 30, 5, 845);
    			attr_dev(a0, "href", "tel:491738370427");
    			add_location(a0, file$8, 31, 5, 877);
    			add_location(p4, file$8, 29, 4, 836);
    			attr_dev(i1, "class", "fas fa-envelope");
    			add_location(i1, file$8, 34, 5, 950);
    			attr_dev(a1, "href", "mailto:holger.freudenberger@freenet.de");
    			add_location(a1, file$8, 35, 5, 985);
    			add_location(p5, file$8, 33, 4, 941);
    			attr_dev(div2, "class", "col-lg-3");
    			add_location(div2, file$8, 27, 3, 776);
    			add_location(i2, file$8, 42, 19, 1155);
    			add_location(br2, file$8, 42, 41, 1177);
    			attr_dev(a2, "href", "#welcome");
    			attr_dev(a2, "class", "underline");
    			add_location(a2, file$8, 43, 4, 1188);
    			attr_dev(div3, "class", "col-lg-3 logout");
    			add_location(div3, file$8, 41, 3, 1106);
    			attr_dev(div4, "class", "row pt-4 pb-4");
    			add_location(div4, file$8, 15, 2, 500);
    			attr_dev(div5, "class", "container");
    			add_location(div5, file$8, 14, 1, 474);
    			attr_dev(section, "id", "footer");
    			attr_dev(section, "class", "svelte-4pkn41");
    			add_location(section, file$8, 11, 0, 394);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, img);
    			append_dev(section, t0);
    			append_dev(section, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div0);
    			append_dev(div0, p0);
    			append_dev(div4, t2);
    			append_dev(div4, div1);
    			append_dev(div1, p1);
    			append_dev(div1, t4);
    			append_dev(div1, p2);
    			append_dev(p2, t5);
    			append_dev(p2, br0);
    			append_dev(p2, t6);
    			append_dev(p2, br1);
    			append_dev(p2, t7);
    			append_dev(div4, t8);
    			append_dev(div4, div2);
    			append_dev(div2, p3);
    			append_dev(div2, t10);
    			append_dev(div2, p4);
    			append_dev(p4, i0);
    			append_dev(p4, t11);
    			append_dev(p4, a0);
    			append_dev(div2, t13);
    			append_dev(div2, p5);
    			append_dev(p5, i1);
    			append_dev(p5, t14);
    			append_dev(p5, a1);
    			append_dev(div4, t16);
    			append_dev(div4, div3);
    			append_dev(div3, t17);
    			append_dev(div3, i2);
    			append_dev(div3, br2);
    			append_dev(div3, t19);
    			append_dev(div3, a2);

    			if (!mounted) {
    				dispose = listen_dev(a2, "click", /*handleLogout*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	const user$1 = get_store_value(user);

    	function handleLogout() {
    		setCookie(USER_INFO, ""); // "remove" cookie
    		window.location.href = window.location.pathname; // reload page
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		setCookie,
    		USER_INFO,
    		userFromStore: user,
    		get: get_store_value,
    		user: user$1,
    		handleLogout
    	});

    	return [user$1, handleLogout];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/components/welcome/Welcome.svelte generated by Svelte v3.38.2 */

    const file$7 = "src/components/welcome/Welcome.svelte";

    function create_fragment$8(ctx) {
    	let section;
    	let div3;
    	let div2;
    	let div0;
    	let p0;
    	let t1;
    	let p1;
    	let t3;
    	let p2;
    	let t5;
    	let p3;
    	let t7;
    	let p4;
    	let t9;
    	let p5;
    	let t11;
    	let p6;
    	let t13;
    	let p7;
    	let t15;
    	let p8;
    	let t17;
    	let div1;
    	let img0;
    	let img0_src_value;
    	let t18;
    	let img1;
    	let img1_src_value;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Liebe Gäste,";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "schön, dass ihr den Weg auf unsere Hochzeitshomepage gefunden habt. Wir wollen\n\t\t\t\t\tdiese Homepage nutzen, um euch mit mehr Informationen rund um die Feier zu\n\t\t\t\t\tversorgen. Das gilt auch und insbesondere, weil ja alles noch ein wenig unter\n\t\t\t\t\t„Corona-Vorbehalt“ steht. Im Moment sind wir sehr zuversichtlich, dass alles so\n\t\t\t\t\tklappt, wie wir es planen und hoffen auf einen Tag ohne größere Einschränkungen.";
    			t3 = space();
    			p2 = element("p");
    			p2.textContent = "Wir freuen uns sehr, diesen Tag mit euch zu verbringen.";
    			t5 = space();
    			p3 = element("p");
    			p3.textContent = "Wir, das sind Catharin & Holger gemeinsam mit Ferris und Hilda. Als sich die\n\t\t\t\t\tWege von uns beiden im August 2017 das erste Mal bei einem Dosenbier auf einer\n\t\t\t\t\tParkbank im Rappenauer Schlosspark kreuzten, stellten wir schnell fest, dass es\n\t\t\t\t\tsehr gut „matcht“ mit uns. Ferris war damals vier Jahre alt und hat sich\n\t\t\t\t\twunderbar in unsere Patchworksituation eingefunden. Heute ist er doppelt so alt\n\t\t\t\t\tund seit gut einem halben Jahr stolzer großer Bruder. Somit sind wir als Familie\n\t\t\t\t\t– Hund Paul gehört auch fest dazu – erst einmal komplett.";
    			t7 = space();
    			p4 = element("p");
    			p4.textContent = "Der optimale Zeitpunkt also, diesen Zustand durch das „Ja“ auf dem Standesamt\n\t\t\t\t\tund auf der Hochzeitsfeier zu besiegeln.";
    			t9 = space();
    			p5 = element("p");
    			p5.textContent = "Auf den folgenden Seiten könnt ihr beispielsweise für unsere Feier zu- oder\n\t\t\t\t\tabsagen, einiges zum Ablauf und zur Örtlichkeit erfahren. Schließlich werden wir\n\t\t\t\t\thier auch ca. zwei Wochen vor der Feier mitteilen, was nach Corona-Verordnung\n\t\t\t\t\talles erlaubt bzw. was nicht möglich ist. Trotz der momentan positiven\n\t\t\t\t\tEntwicklung der Inzidenz kann es immer noch sein, dass wir nicht wie geplant\n\t\t\t\t\tfeiern können. Für diesen Fall bitten wir jetzt schon für euer Verständnis.";
    			t11 = space();
    			p6 = element("p");
    			p6.textContent = "Viel Freude beim Durchstöbern der Seiten und bis bald.";
    			t13 = space();
    			p7 = element("p");
    			p7.textContent = "Cathe, Holger, Ferris & Hilda";
    			t15 = space();
    			p8 = element("p");
    			p8.textContent = "P.S. diese Seiten werden im Laufe der Zeit mit weiteren Informationen gefüttert,\n\t\t\t\t\tgerne dürft ihr also hier her wiederkommen";
    			t17 = space();
    			div1 = element("div");
    			img0 = element("img");
    			t18 = space();
    			img1 = element("img");
    			add_location(p0, file$7, 6, 4, 127);
    			add_location(p1, file$7, 8, 4, 152);
    			add_location(p2, file$7, 16, 4, 588);
    			add_location(p3, file$7, 18, 4, 656);
    			add_location(p4, file$7, 28, 4, 1237);
    			add_location(p5, file$7, 33, 4, 1384);
    			add_location(p6, file$7, 42, 4, 1891);
    			attr_dev(p7, "class", "greeting svelte-vptu3a");
    			add_location(p7, file$7, 44, 4, 1958);
    			attr_dev(p8, "class", "mb-0");
    			add_location(p8, file$7, 46, 4, 2017);
    			attr_dev(div0, "class", "col-lg-6");
    			add_location(div0, file$7, 5, 3, 100);
    			if (img0.src !== (img0_src_value = "images/welcome.jpg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Cathe, Holger, Ferris & Hilda");
    			attr_dev(img0, "class", "welcome-img svelte-vptu3a");
    			add_location(img0, file$7, 53, 4, 2224);
    			attr_dev(div1, "class", "col-lg-6 frame");
    			add_location(div1, file$7, 52, 3, 2191);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$7, 4, 2, 79);
    			attr_dev(div3, "class", "container");
    			add_location(div3, file$7, 3, 1, 53);
    			if (img1.src !== (img1_src_value = "images/wave1.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			attr_dev(img1, "class", "wave-img svelte-vptu3a");
    			add_location(img1, file$7, 62, 1, 2361);
    			attr_dev(section, "id", "welcome");
    			attr_dev(section, "class", "svelte-vptu3a");
    			add_location(section, file$7, 2, 0, 29);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, p0);
    			append_dev(div0, t1);
    			append_dev(div0, p1);
    			append_dev(div0, t3);
    			append_dev(div0, p2);
    			append_dev(div0, t5);
    			append_dev(div0, p3);
    			append_dev(div0, t7);
    			append_dev(div0, p4);
    			append_dev(div0, t9);
    			append_dev(div0, p5);
    			append_dev(div0, t11);
    			append_dev(div0, p6);
    			append_dev(div0, t13);
    			append_dev(div0, p7);
    			append_dev(div0, t15);
    			append_dev(div0, p8);
    			append_dev(div2, t17);
    			append_dev(div2, div1);
    			append_dev(div1, img0);
    			append_dev(section, t18);
    			append_dev(section, img1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Welcome", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Welcome> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Welcome extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Welcome",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/components/schedule/Schedule.svelte generated by Svelte v3.38.2 */
    const file$6 = "src/components/schedule/Schedule.svelte";

    // (34:3) {:else}
    function create_else_block$3(ctx) {
    	let div;
    	let p0;
    	let t1;
    	let p1;
    	let t3;
    	let p2;
    	let t5;
    	let p3;
    	let t7;
    	let table;
    	let tr0;
    	let td0;
    	let td1;
    	let t10;
    	let tr1;
    	let td2;
    	let td3;
    	let t13;
    	let tr2;
    	let td4;
    	let td5;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			p0.textContent = "Liebe Partygäste,";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "wir fingen eigentlich klein an zu planen, wollten erst nur im engeren\n\t\t\t\t\t\tFamilienkreis unsere Hochzeit feiern – coronabedingt. Dass jetzt aber wieder\n\t\t\t\t\t\tmehr möglich ist, freut uns sehr.";
    			t3 = space();
    			p2 = element("p");
    			p2.textContent = "Umso mehr würde es uns freuen, wenn ihr auf unsere Hochzeitsparty kommt und\n\t\t\t\t\t\tmit uns feiert. Nach unserer standesamtlichen Trauung im Rathaus in Bad\n\t\t\t\t\t\tRappenau am Vormittag beginnen wir die Feier in der Heidersbacher Mühle im\n\t\t\t\t\t\tetwas kleineren Kreis. Für den Abend ist dann im Zelt – also quasi im\n\t\t\t\t\t\tAußenbereich – wieder eine größere Anzahl an Gästen möglich.";
    			t5 = space();
    			p3 = element("p");
    			p3.textContent = "Für euch sieht dann der Abend wie folgt aus:";
    			t7 = space();
    			table = element("table");
    			tr0 = element("tr");
    			td0 = element("td");
    			td0.textContent = "ab 20:30 Uhr";
    			td1 = element("td");
    			td1.textContent = "Ankommen an der Heidersbacher Mühle, ihr werdet mit einem Aperitiv\n\t\t\t\t\t\t\t\toder einem sonstigen Getränk in Empfang genommen";
    			t10 = space();
    			tr1 = element("tr");
    			td2 = element("td");
    			td2.textContent = "ab ca. 21 Uhr";
    			td3 = element("td");
    			td3.textContent = "Hochzeitsparty mit Live-Musik";
    			t13 = space();
    			tr2 = element("tr");
    			td4 = element("td");
    			td4.textContent = "ab ca. 22 Uhr";
    			td5 = element("td");
    			td5.textContent = "kleine Stärkung aus der Küche";
    			add_location(p0, file$6, 38, 5, 1494);
    			add_location(p1, file$6, 39, 5, 1524);
    			add_location(p2, file$6, 44, 5, 1742);
    			add_location(p3, file$6, 51, 5, 2145);
    			attr_dev(td0, "class", "svelte-6okh4q");
    			add_location(td0, file$6, 55, 8, 2229);
    			attr_dev(td1, "class", "svelte-6okh4q");
    			add_location(td1, file$6, 55, 29, 2250);
    			attr_dev(tr0, "class", "svelte-6okh4q");
    			add_location(tr0, file$6, 54, 6, 2217);
    			attr_dev(td2, "class", "svelte-6okh4q");
    			add_location(td2, file$6, 60, 10, 2422);
    			attr_dev(td3, "class", "svelte-6okh4q");
    			add_location(td3, file$6, 60, 32, 2444);
    			attr_dev(tr1, "class", "svelte-6okh4q");
    			add_location(tr1, file$6, 60, 6, 2418);
    			attr_dev(td4, "class", "svelte-6okh4q");
    			add_location(td4, file$6, 61, 10, 2498);
    			attr_dev(td5, "class", "svelte-6okh4q");
    			add_location(td5, file$6, 61, 32, 2520);
    			attr_dev(tr2, "class", "svelte-6okh4q");
    			add_location(tr2, file$6, 61, 6, 2494);
    			attr_dev(table, "class", "svelte-6okh4q");
    			add_location(table, file$6, 53, 5, 2203);
    			attr_dev(div, "class", "col");
    			add_location(div, file$6, 37, 4, 1471);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(div, t1);
    			append_dev(div, p1);
    			append_dev(div, t3);
    			append_dev(div, p2);
    			append_dev(div, t5);
    			append_dev(div, p3);
    			append_dev(div, t7);
    			append_dev(div, table);
    			append_dev(table, tr0);
    			append_dev(tr0, td0);
    			append_dev(tr0, td1);
    			append_dev(table, t10);
    			append_dev(table, tr1);
    			append_dev(tr1, td2);
    			append_dev(tr1, td3);
    			append_dev(table, t13);
    			append_dev(table, tr2);
    			append_dev(tr2, td4);
    			append_dev(tr2, td5);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(34:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (10:3) {#if user.type === 'ALL_DAY'}
    function create_if_block$3(ctx) {
    	let div0;
    	let p;
    	let t1;
    	let div1;
    	let table;
    	let tr0;
    	let td0;
    	let td1;
    	let t4;
    	let tr1;
    	let td2;
    	let td3;
    	let t7;
    	let tr2;
    	let td4;
    	let td5;
    	let t10;
    	let tr3;
    	let td6;
    	let td7;
    	let t13;
    	let tr4;
    	let td8;
    	let td9;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			p = element("p");
    			p.textContent = "Nach unserer standesamtlichen Trauung im Rathaus in Bad Rappenau freuen wir\n\t\t\t\t\t\tuns darauf euch in der Heidersbacher Mühle ab 14:00 Uhr begrüßen zu dürfen.\n\t\t\t\t\t\tDort haben wir folgenden Ablauf geplant:";
    			t1 = space();
    			div1 = element("div");
    			table = element("table");
    			tr0 = element("tr");
    			td0 = element("td");
    			td0.textContent = "ab 14 Uhr";
    			td1 = element("td");
    			td1.textContent = "Ankommen auf dem Gelände der Heidersbacher Mühle";
    			t4 = space();
    			tr1 = element("tr");
    			td2 = element("td");
    			td2.textContent = "ca. 14:30 Uhr";
    			td3 = element("td");
    			td3.textContent = "freie Trauung auf der Waldlichtung";
    			t7 = space();
    			tr2 = element("tr");
    			td4 = element("td");
    			td4.textContent = "ca. 15:30 Uhr";
    			td5 = element("td");
    			td5.textContent = "Kaffee, Hochzeitstorte und Häppchen";
    			t10 = space();
    			tr3 = element("tr");
    			td6 = element("td");
    			td6.textContent = "ca. 18 Uhr";
    			td7 = element("td");
    			td7.textContent = "Hochzeitsessen";
    			t13 = space();
    			tr4 = element("tr");
    			td8 = element("td");
    			td8.textContent = "ab ca. 20:30 Uhr";
    			td9 = element("td");
    			td9.textContent = "Hochzeitsparty";
    			add_location(p, file$6, 14, 5, 550);
    			attr_dev(div0, "class", "col-lg-4");
    			add_location(div0, file$6, 13, 4, 522);
    			attr_dev(td0, "class", "svelte-6okh4q");
    			add_location(td0, file$6, 23, 8, 844);
    			attr_dev(td1, "class", "svelte-6okh4q");
    			add_location(td1, file$6, 23, 26, 862);
    			attr_dev(tr0, "class", "svelte-6okh4q");
    			add_location(tr0, file$6, 22, 6, 832);
    			attr_dev(td2, "class", "svelte-6okh4q");
    			add_location(td2, file$6, 27, 10, 959);
    			attr_dev(td3, "class", "svelte-6okh4q");
    			add_location(td3, file$6, 27, 32, 981);
    			attr_dev(tr1, "class", "svelte-6okh4q");
    			add_location(tr1, file$6, 27, 6, 955);
    			attr_dev(td4, "class", "svelte-6okh4q");
    			add_location(td4, file$6, 28, 10, 1040);
    			attr_dev(td5, "class", "svelte-6okh4q");
    			add_location(td5, file$6, 28, 32, 1062);
    			attr_dev(tr2, "class", "svelte-6okh4q");
    			add_location(tr2, file$6, 28, 6, 1036);
    			attr_dev(td6, "class", "svelte-6okh4q");
    			add_location(td6, file$6, 29, 10, 1122);
    			attr_dev(td7, "class", "svelte-6okh4q");
    			add_location(td7, file$6, 29, 29, 1141);
    			attr_dev(tr3, "class", "svelte-6okh4q");
    			add_location(tr3, file$6, 29, 6, 1118);
    			attr_dev(td8, "class", "svelte-6okh4q");
    			add_location(td8, file$6, 30, 10, 1180);
    			attr_dev(td9, "class", "svelte-6okh4q");
    			add_location(td9, file$6, 30, 35, 1205);
    			attr_dev(tr4, "class", "svelte-6okh4q");
    			add_location(tr4, file$6, 30, 6, 1176);
    			attr_dev(table, "class", "svelte-6okh4q");
    			add_location(table, file$6, 21, 5, 818);
    			attr_dev(div1, "class", "col-lg-8");
    			add_location(div1, file$6, 20, 4, 790);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, p);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, table);
    			append_dev(table, tr0);
    			append_dev(tr0, td0);
    			append_dev(tr0, td1);
    			append_dev(table, t4);
    			append_dev(table, tr1);
    			append_dev(tr1, td2);
    			append_dev(tr1, td3);
    			append_dev(table, t7);
    			append_dev(table, tr2);
    			append_dev(tr2, td4);
    			append_dev(tr2, td5);
    			append_dev(table, t10);
    			append_dev(table, tr3);
    			append_dev(tr3, td6);
    			append_dev(tr3, td7);
    			append_dev(table, t13);
    			append_dev(table, tr4);
    			append_dev(tr4, td8);
    			append_dev(tr4, td9);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(10:3) {#if user.type === 'ALL_DAY'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let section;
    	let div1;
    	let h2;
    	let t1;
    	let div0;

    	function select_block_type(ctx, dirty) {
    		if (/*user*/ ctx[0].type === "ALL_DAY") return create_if_block$3;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			div1 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Ablauf";
    			t1 = space();
    			div0 = element("div");
    			if_block.c();
    			attr_dev(h2, "class", "text-center");
    			add_location(h2, file$6, 7, 2, 219);
    			attr_dev(div0, "class", "row section-body");
    			add_location(div0, file$6, 8, 2, 257);
    			attr_dev(div1, "class", "container");
    			add_location(div1, file$6, 6, 1, 193);
    			attr_dev(section, "id", "schedule");
    			attr_dev(section, "class", "section");
    			add_location(section, file$6, 5, 0, 152);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div1);
    			append_dev(div1, h2);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			if_block.m(div0, null);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Schedule", slots, []);
    	const user$1 = get_store_value(user);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Schedule> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ userFromStore: user, get: get_store_value, user: user$1 });
    	return [user$1];
    }

    class Schedule extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Schedule",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/components/location/Location.svelte generated by Svelte v3.38.2 */

    const file$5 = "src/components/location/Location.svelte";

    function create_fragment$6(ctx) {
    	let section;
    	let div3;
    	let h2;
    	let t1;
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t2;
    	let div1;
    	let p0;
    	let t4;
    	let p1;
    	let t6;
    	let p2;
    	let a0;
    	let t8;
    	let span;
    	let t9;
    	let a1;
    	let t11;
    	let t12;
    	let p3;
    	let t14;
    	let p4;
    	let t16;
    	let p5;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div3 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Location";
    			t1 = space();
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t2 = space();
    			div1 = element("div");
    			p0 = element("p");
    			p0.textContent = "Die Örtlichkeit für unsere Feier führt uns ein paar Kilometer weg von Bad\n\t\t\t\t\tRappenau bzw. Waibstadt ins Elztal bei Mosbach im Odenwald.";
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = "Als wir vor ein paar Wochen noch an ein kleines Essen im engsten Familienkreis\n\t\t\t\t\tdachten haben wir den";
    			t6 = space();
    			p2 = element("p");
    			a0 = element("a");
    			a0.textContent = "Landgasthof Heidersbacher Mühle";
    			t8 = text(",\n\t\t\t\t\t");
    			span = element("span");
    			t9 = text("74834 Elztal-Rittersbach (");
    			a1 = element("a");
    			a1.textContent = "Anfahrt";
    			t11 = text(")");
    			t12 = space();
    			p3 = element("p");
    			p3.textContent = "für uns entdeckt. Jetzt, da wir unsere Feier „etwas“ größer als ursprünglich\n\t\t\t\t\tgedacht planen, gefällt uns dieser Ort umso mehr. Wir sind uns sicher, dass sich\n\t\t\t\t\tdiese Extrakilometer für euch lohnen werden.";
    			t14 = space();
    			p4 = element("p");
    			p4.textContent = "Wir werden in und um ein historisches Mühlengebäude an der Elz, idyllisch mitten\n\t\t\t\t\tim Wald gelegen, feiern.";
    			t16 = space();
    			p5 = element("p");
    			p5.textContent = "Die Produkte, die von der Wirtsfamilie verwendet werden, sind regional, frisch\n\t\t\t\t\tund kommen aus nachhaltiger Erzeugung. Das war uns wichtig und wir hoffen, ihr\n\t\t\t\t\tschmeckt es.";
    			attr_dev(h2, "class", "text-center");
    			add_location(h2, file$5, 4, 2, 112);
    			if (img.src !== (img_src_value = "images/location.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Landgasthof Heidersbacher Mühle");
    			attr_dev(img, "class", "image svelte-1o7hj7o");
    			add_location(img, file$5, 7, 4, 219);
    			attr_dev(div0, "class", "col-lg-4 frame svelte-1o7hj7o");
    			add_location(div0, file$5, 6, 3, 186);
    			add_location(p0, file$5, 14, 4, 364);
    			add_location(p1, file$5, 18, 4, 525);
    			attr_dev(a0, "href", "https://www.heidersbacher-muehle.de");
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "class", "underline");
    			add_location(a0, file$5, 23, 5, 679);
    			attr_dev(a1, "href", "https://goo.gl/maps/JKJtHvGvQQw8jCXk9");
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "class", "underline");
    			add_location(a1, file$5, 27, 33, 882);
    			set_style(span, "white-space", "nowrap");
    			add_location(span, file$5, 26, 5, 814);
    			attr_dev(p2, "class", "offset-1");
    			add_location(p2, file$5, 22, 4, 653);
    			add_location(p3, file$5, 34, 4, 1031);
    			add_location(p4, file$5, 39, 4, 1266);
    			attr_dev(p5, "class", "mb-0");
    			add_location(p5, file$5, 43, 4, 1399);
    			attr_dev(div1, "class", "col-lg-8");
    			add_location(div1, file$5, 13, 3, 337);
    			attr_dev(div2, "class", "row section-body");
    			add_location(div2, file$5, 5, 2, 152);
    			attr_dev(div3, "class", "container");
    			add_location(div3, file$5, 3, 1, 86);
    			attr_dev(section, "id", "location");
    			attr_dev(section, "class", "section grey-background");
    			add_location(section, file$5, 2, 0, 29);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div3);
    			append_dev(div3, h2);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, p0);
    			append_dev(div1, t4);
    			append_dev(div1, p1);
    			append_dev(div1, t6);
    			append_dev(div1, p2);
    			append_dev(p2, a0);
    			append_dev(p2, t8);
    			append_dev(p2, span);
    			append_dev(span, t9);
    			append_dev(span, a1);
    			append_dev(span, t11);
    			append_dev(div1, t12);
    			append_dev(div1, p3);
    			append_dev(div1, t14);
    			append_dev(div1, p4);
    			append_dev(div1, t16);
    			append_dev(div1, p5);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Location", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Location> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Location extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Location",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/sleep/Sleep.svelte generated by Svelte v3.38.2 */

    const file$4 = "src/components/sleep/Sleep.svelte";

    function create_fragment$5(ctx) {
    	let section;
    	let div4;
    	let h2;
    	let t1;
    	let div3;
    	let div0;
    	let p0;
    	let t3;
    	let div1;
    	let t4;
    	let div2;
    	let h40;
    	let a0;
    	let t6;
    	let p1;
    	let t8;
    	let h41;
    	let a1;
    	let t10;
    	let p2;
    	let t12;
    	let h42;
    	let a2;
    	let t14;
    	let p3;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div4 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Übernachten";
    			t1 = space();
    			div3 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Für unsere Gäste mit einer längeren Anreise und aus dem Grund, da wir ein paar\n\t\t\t\t\tKilometer von Zuhause entfernt feiern, haben wir euch ein paar\n\t\t\t\t\tÜbernachtungsmöglichkeiten zusammengestellt:";
    			t3 = space();
    			div1 = element("div");
    			t4 = space();
    			div2 = element("div");
    			h40 = element("h4");
    			a0 = element("a");
    			a0.textContent = "Landhotel Engel Limbach";
    			t6 = space();
    			p1 = element("p");
    			p1.textContent = "Hier übernachtet ihr günstig und nahe bei der Feier. Wir haben einige Zimmer zum\n\t\t\t\t\tVorteilspreis für unsere Hochzeit geblockt – meldet euch bei uns, falls ihr 4 km\n\t\t\t\t\tLuftlinie von der Heidersbacher Mühle übernachten wollt.";
    			t8 = space();
    			h41 = element("h4");
    			a1 = element("a");
    			a1.textContent = "Hotel am Wasserschloss Bad Rappenau";
    			t10 = space();
    			p2 = element("p");
    			p2.textContent = "Neu eröffnet bietet das Hotel preisgünstige Übernachtungen mit Zimmern auf gutem\n\t\t\t\t\tNiveau.";
    			t12 = space();
    			h42 = element("h4");
    			a2 = element("a");
    			a2.textContent = "Hotel Saline 1822 Bad Rappenau";
    			t14 = space();
    			p3 = element("p");
    			p3.textContent = "Erste Adresse in der Kurstadt – wer mit Kur- und Salinenpark die\n\t\t\t\t\t„Sehenswürdigkeiten“ Bad Rappenaus entdecken möchte, hat hier den idealen\n\t\t\t\t\tAusgangspunkt.";
    			attr_dev(h2, "class", "text-center");
    			add_location(h2, file$4, 4, 2, 93);
    			add_location(p0, file$4, 7, 4, 197);
    			attr_dev(div0, "class", "col-lg-2");
    			add_location(div0, file$4, 6, 3, 170);
    			attr_dev(div1, "class", "col-lg-1");
    			add_location(div1, file$4, 13, 3, 425);
    			attr_dev(a0, "href", "https://www.engel-balsbach.de");
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "class", "underline");
    			add_location(a0, file$4, 16, 5, 490);
    			add_location(h40, file$4, 15, 4, 480);
    			add_location(p1, file$4, 20, 4, 619);
    			attr_dev(a1, "href", "https://www.hotelamwasserschloss.de");
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "class", "underline");
    			add_location(a1, file$4, 27, 5, 881);
    			add_location(h41, file$4, 26, 4, 871);
    			add_location(p2, file$4, 31, 4, 1028);
    			attr_dev(a2, "href", "https://www.saline1822.de");
    			attr_dev(a2, "target", "_blank");
    			attr_dev(a2, "class", "underline");
    			add_location(a2, file$4, 37, 5, 1155);
    			add_location(h42, file$4, 36, 4, 1145);
    			add_location(p3, file$4, 41, 4, 1287);
    			attr_dev(div2, "class", "col-lg-8");
    			add_location(div2, file$4, 14, 3, 453);
    			attr_dev(div3, "class", "row section-body");
    			add_location(div3, file$4, 5, 2, 136);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$4, 3, 1, 67);
    			attr_dev(section, "id", "sleep");
    			attr_dev(section, "class", "section");
    			add_location(section, file$4, 2, 0, 29);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div4);
    			append_dev(div4, h2);
    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, p0);
    			append_dev(div3, t3);
    			append_dev(div3, div1);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, h40);
    			append_dev(h40, a0);
    			append_dev(div2, t6);
    			append_dev(div2, p1);
    			append_dev(div2, t8);
    			append_dev(div2, h41);
    			append_dev(h41, a1);
    			append_dev(div2, t10);
    			append_dev(div2, p2);
    			append_dev(div2, t12);
    			append_dev(div2, h42);
    			append_dev(h42, a2);
    			append_dev(div2, t14);
    			append_dev(div2, p3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Sleep", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Sleep> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Sleep extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sleep",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/gifts/Gifts.svelte generated by Svelte v3.38.2 */

    const file$3 = "src/components/gifts/Gifts.svelte";

    function create_fragment$4(ctx) {
    	let section;
    	let div2;
    	let h2;
    	let t1;
    	let div1;
    	let div0;
    	let p0;
    	let t3;
    	let p1;
    	let t5;
    	let p2;
    	let t6;
    	let a;
    	let t8;
    	let t9;
    	let p3;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div2 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Präsente";
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Das größte Geschenk für uns ist, dass ihr mit uns diesen Tag verbringt und\n\t\t\t\t\tunsere Feier bereichert. Das ist uns schon genug. Solltet ihr darüber hinaus\n\t\t\t\t\tnoch den Wunsch haben, uns zu beschenken, hier einige Anmerkungen.";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "Als Familie haben wir schon seit einiger Zeit einen gemeinsamen Hausstand, daher\n\t\t\t\t\tsind wir eigentlich voll ausgestattet, was Geschirr, Haushaltsgeräte etc.\n\t\t\t\t\tbetrifft. Da wir aber im Moment unser eigenes Dach über dem Kopf planen und\n\t\t\t\t\tnächstes Jahr bauen, haben wir hierfür durchaus Wünsche und Einrichtungsbedarf.\n\t\t\t\t\tDiese könnten wir uns beispielsweise in einem allseits bekannten\n\t\t\t\t\tEinrichtungshaus aus Skandinavien erfüllen. Offen gesagt Gutscheine bei Ikea\n\t\t\t\t\t(Möbel) oder Media Markt (Elektrogeräte) würden uns da sehr freuen und\n\t\t\t\t\tweiterhelfen.";
    			t5 = space();
    			p2 = element("p");
    			t6 = text("Wir wollen auf der Feier weitestgehend auf „Spielchen“ verzichten. Zu diesen\n\t\t\t\t\tgehört auch, dass in unterschiedlichster Form Geld für das Brautpaar\n\t\t\t\t\teingesammelt wird. Stattdessen wollen wir am Abend Geld sammeln und dies der\n\t\t\t\t\tOrganisation ");
    			a = element("a");
    			a.textContent = "„Children of Mathare“";
    			t8 = text(" übergeben.");
    			t9 = space();
    			p3 = element("p");
    			p3.textContent = "Die Organisation wird auf der Feier kurz vorgestellt. Gerne dürft ihr euch vorab\n\t\t\t\t\tauf der Homepage informieren, dass das Geld ohne Verwaltungsausgaben Kindern im\n\t\t\t\t\tgrößten Slum Nairobis (Kenia) zu Gute kommt.";
    			attr_dev(h2, "class", "text-center");
    			add_location(h2, file$3, 4, 2, 109);
    			add_location(p0, file$3, 7, 4, 205);
    			add_location(p1, file$3, 13, 4, 457);
    			attr_dev(a, "href", "https://children-of-mathare.org");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "class", "underline");
    			add_location(a, file$3, 28, 18, 1313);
    			add_location(p2, file$3, 24, 4, 1053);
    			add_location(p3, file$3, 35, 4, 1464);
    			attr_dev(div0, "class", "col");
    			add_location(div0, file$3, 6, 3, 183);
    			attr_dev(div1, "class", "row section-body");
    			add_location(div1, file$3, 5, 2, 149);
    			attr_dev(div2, "class", "container");
    			add_location(div2, file$3, 3, 1, 83);
    			attr_dev(section, "id", "gifts");
    			attr_dev(section, "class", "section grey-background");
    			add_location(section, file$3, 2, 0, 29);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div2);
    			append_dev(div2, h2);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(div0, t3);
    			append_dev(div0, p1);
    			append_dev(div0, t5);
    			append_dev(div0, p2);
    			append_dev(p2, t6);
    			append_dev(p2, a);
    			append_dev(p2, t8);
    			append_dev(div0, t9);
    			append_dev(div0, p3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Gifts", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Gifts> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Gifts extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Gifts",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/news/News.svelte generated by Svelte v3.38.2 */

    const file$2 = "src/components/news/News.svelte";

    function create_fragment$3(ctx) {
    	let section;
    	let div2;
    	let h2;
    	let t1;
    	let div1;
    	let div0;
    	let p0;
    	let t3;
    	let p1;
    	let t5;
    	let p2;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div2 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Newsfeed – auch zu möglichen Corona-Beschränkungen";
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "2021 steht vieles unter Corona-Vorbehalt, auch unsere Hochzeitsfeier. Hier\n\t\t\t\t\twerden wir euch über die Vorgaben aus der dann gültigen Corona-Verordnung\n\t\t\t\t\tinformieren. Das kann die Durchführung der Feier und Schnelltests betreffen.";
    			t3 = space();
    			p1 = element("p");
    			p1.textContent = "Im Moment hoffen wir sehr, dass wir mit euch allen ohne größere Einschränkungen\n\t\t\t\t\tfeiern können. Selbstredend können wir das nicht garantieren.";
    			t5 = space();
    			p2 = element("p");
    			p2.textContent = "Auf dieser Seite erfahrt ihr ca. Anfang August, welche Einschränkungen die\n\t\t\t\t\tPandemie unserer Hochzeit bereitet. Da wir natürlich hoffen, dass die\n\t\t\t\t\tEinschränkungen möglichst gering ausfallen, erfahrt ihr hier auch sonstige\n\t\t\t\t\tNeuigkeiten rund um die Feier.";
    			attr_dev(h2, "class", "text-center");
    			add_location(h2, file$2, 4, 2, 108);
    			add_location(p0, file$2, 7, 4, 246);
    			add_location(p1, file$2, 13, 4, 505);
    			add_location(p2, file$2, 18, 4, 675);
    			attr_dev(div0, "class", "col");
    			add_location(div0, file$2, 6, 3, 224);
    			attr_dev(div1, "class", "row section-body");
    			add_location(div1, file$2, 5, 2, 190);
    			attr_dev(div2, "class", "container");
    			add_location(div2, file$2, 3, 1, 82);
    			attr_dev(section, "id", "news");
    			attr_dev(section, "class", "section grey-background");
    			add_location(section, file$2, 2, 0, 29);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div2);
    			append_dev(div2, h2);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(div0, t3);
    			append_dev(div0, p1);
    			append_dev(div0, t5);
    			append_dev(div0, p2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("News", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<News> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class News extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "News",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/components/login/Login.svelte generated by Svelte v3.38.2 */

    const { Error: Error_1$1 } = globals;
    const file$1 = "src/components/login/Login.svelte";

    // (65:3) {:else}
    function create_else_block_1$1(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*errorMsg*/ ctx[3]);
    			attr_dev(p, "class", "error svelte-jx1w9l");
    			add_location(p, file$1, 65, 4, 2821);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*errorMsg*/ 8) set_data_dev(t, /*errorMsg*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(65:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (63:3) {#if !errorMsg?.trim()}
    function create_if_block_1$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Bitte gib hier den Nutzer und das Passwort aus deiner Einladung ein:";
    			add_location(p, file$1, 63, 4, 2730);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(63:3) {#if !errorMsg?.trim()}",
    		ctx
    	});

    	return block;
    }

    // (77:4) {:else}
    function create_else_block$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Bitte warten...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(77:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (75:4) {#if !isLoading}
    function create_if_block$2(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Anmelden";
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "button svelte-jx1w9l");
    			add_location(button, file$1, 75, 5, 3077);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(75:4) {#if !isLoading}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div4;
    	let form;
    	let h1;
    	let t1;
    	let div0;
    	let img;
    	let img_src_value;
    	let t2;
    	let div3;
    	let show_if;
    	let t3;
    	let div1;
    	let input0;
    	let t4;
    	let input1;
    	let t5;
    	let div2;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (show_if == null || dirty & /*errorMsg*/ 8) show_if = !!!/*errorMsg*/ ctx[3]?.trim();
    		if (show_if) return create_if_block_1$1;
    		return create_else_block_1$1;
    	}

    	let current_block_type = select_block_type(ctx, -1);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (!/*isLoading*/ ctx[0]) return create_if_block$2;
    		return create_else_block$2;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			form = element("form");
    			h1 = element("h1");
    			h1.textContent = "Willkommen";
    			t1 = space();
    			div0 = element("div");
    			img = element("img");
    			t2 = space();
    			div3 = element("div");
    			if_block0.c();
    			t3 = space();
    			div1 = element("div");
    			input0 = element("input");
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			div2 = element("div");
    			if_block1.c();
    			attr_dev(h1, "class", "svelte-jx1w9l");
    			add_location(h1, file$1, 57, 2, 2546);
    			if (img.src !== (img_src_value = "images/welcome.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Cathe, Holger, Ferris & Hilda");
    			attr_dev(img, "class", "svelte-jx1w9l");
    			add_location(img, file$1, 59, 3, 2592);
    			attr_dev(div0, "class", "avatar svelte-jx1w9l");
    			add_location(div0, file$1, 58, 2, 2568);
    			attr_dev(input0, "placeholder", "Nutzer");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "svelte-jx1w9l");
    			add_location(input0, file$1, 69, 4, 2876);
    			attr_dev(input1, "placeholder", "Passwort");
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "class", "svelte-jx1w9l");
    			add_location(input1, file$1, 70, 4, 2945);
    			add_location(div1, file$1, 68, 3, 2866);
    			attr_dev(div2, "class", "footer svelte-jx1w9l");
    			add_location(div2, file$1, 73, 3, 3030);
    			attr_dev(div3, "class", "form-content");
    			add_location(div3, file$1, 61, 2, 2672);
    			attr_dev(form, "class", "svelte-jx1w9l");
    			add_location(form, file$1, 56, 1, 2504);
    			attr_dev(div4, "class", "login-form animate__animated animate__zoomIn animate__faster svelte-jx1w9l");
    			add_location(div4, file$1, 55, 0, 2428);
    		},
    		l: function claim(nodes) {
    			throw new Error_1$1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, form);
    			append_dev(form, h1);
    			append_dev(form, t1);
    			append_dev(form, div0);
    			append_dev(div0, img);
    			append_dev(form, t2);
    			append_dev(form, div3);
    			if_block0.m(div3, null);
    			append_dev(div3, t3);
    			append_dev(div3, div1);
    			append_dev(div1, input0);
    			set_input_value(input0, /*username*/ ctx[1]);
    			append_dev(div1, t4);
    			append_dev(div1, input1);
    			set_input_value(input1, /*password*/ ctx[2]);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			if_block1.m(div2, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[5]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[6]),
    					listen_dev(form, "submit", prevent_default(/*login*/ ctx[4]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div3, t3);
    				}
    			}

    			if (dirty & /*username*/ 2 && input0.value !== /*username*/ ctx[1]) {
    				set_input_value(input0, /*username*/ ctx[1]);
    			}

    			if (dirty & /*password*/ 4 && input1.value !== /*password*/ ctx[2]) {
    				set_input_value(input1, /*password*/ ctx[2]);
    			}

    			if (current_block_type_1 !== (current_block_type_1 = select_block_type_1(ctx))) {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div2, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if_block0.d();
    			if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Login", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	let isLoading = false;
    	let username;
    	let password;
    	let errorMsg;

    	// see comment in style section below
    	document.body.style.setProperty("height", "100%");

    	document.documentElement.style.setProperty("height", "100%");
    	window.matchMedia("(min-width: 992px)").matches && document.body.style.setProperty("background", "var(--gradient)");

    	function login() {
    		return __awaiter(this, void 0, void 0, function* () {
    			if (!(username === null || username === void 0
    			? void 0
    			: username.trim()) || !(password === null || password === void 0
    			? void 0
    			: password.trim())) {
    				$$invalidate(3, errorMsg = "Bitte die Felder für den Nutzer und das Passwort ausfüllen");
    				return;
    			}

    			$$invalidate(0, isLoading = true);
    			$$invalidate(3, errorMsg = undefined);

    			try {
    				const response = yield fetch(ENDPOINT.login, {
    					method: "POST",
    					headers: { "Content-Type": "application/json" },
    					body: JSON.stringify({ username, password })
    				});

    				if (!response.ok) {
    					throw new Error();
    				} else {
    					const json = yield response.json();
    					setCookie(USER_INFO, JSON.stringify(json));
    					window.location.href = window.location.pathname; // reload page
    					return;
    				}
    			} catch(err) {
    				$$invalidate(3, errorMsg = "Hoppla, da ging was schief… Probiere es doch noch einmal. Wenn du weiterhin Probleme hast, wende dich bitte an Cathe oder Holger.");
    			}

    			$$invalidate(0, isLoading = false);
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		username = this.value;
    		$$invalidate(1, username);
    	}

    	function input1_input_handler() {
    		password = this.value;
    		$$invalidate(2, password);
    	}

    	$$self.$capture_state = () => ({
    		__awaiter,
    		setCookie,
    		USER_INFO,
    		ENDPOINT,
    		isLoading,
    		username,
    		password,
    		errorMsg,
    		login
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("isLoading" in $$props) $$invalidate(0, isLoading = $$props.isLoading);
    		if ("username" in $$props) $$invalidate(1, username = $$props.username);
    		if ("password" in $$props) $$invalidate(2, password = $$props.password);
    		if ("errorMsg" in $$props) $$invalidate(3, errorMsg = $$props.errorMsg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		isLoading,
    		username,
    		password,
    		errorMsg,
    		login,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/response/Response.svelte generated by Svelte v3.38.2 */

    const { Error: Error_1, Object: Object_1, console: console_1$1 } = globals;
    const file = "src/components/response/Response.svelte";

    // (125:2) {:else}
    function create_else_block$1(ctx) {
    	let form;
    	let show_if = /*errorMsg*/ ctx[6]?.trim();
    	let t0;
    	let div1;
    	let label0;
    	let t2;
    	let div0;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let t6;
    	let t7;
    	let div3;
    	let label1;
    	let t9;
    	let div2;
    	let textarea;
    	let t10;
    	let div5;
    	let div4;
    	let mounted;
    	let dispose;
    	let if_block0 = show_if && create_if_block_3(ctx);
    	let if_block1 = /*participation*/ ctx[0] === "1" && create_if_block_2(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (!/*isLoading*/ ctx[7]) return create_if_block_1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block2 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			form = element("form");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "Ich/wir komme(n)";
    			t2 = space();
    			div0 = element("div");
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Auswählen…";
    			option1 = element("option");
    			option1.textContent = "ja";
    			option2 = element("option");
    			option2.textContent = "nein";
    			t6 = space();
    			if (if_block1) if_block1.c();
    			t7 = space();
    			div3 = element("div");
    			label1 = element("label");
    			label1.textContent = "Bemerkungen (insbesondere: Anzahl vegetarische Mahlzeiten/Übernachtung in\n\t\t\t\t\t\tLimbach (Hotel Engel) erwünscht)";
    			t9 = space();
    			div2 = element("div");
    			textarea = element("textarea");
    			t10 = space();
    			div5 = element("div");
    			div4 = element("div");
    			if_block2.c();
    			attr_dev(label0, "for", "participation");
    			attr_dev(label0, "class", "col-lg-3 col-form-label");
    			add_location(label0, file, 133, 5, 4717);
    			option0.__value = "";
    			option0.value = option0.__value;
    			option0.selected = true;
    			add_location(option0, file, 138, 7, 4932);
    			option1.__value = "1";
    			option1.value = option1.__value;
    			add_location(option1, file, 139, 7, 4985);
    			option2.__value = "0";
    			option2.value = option2.__value;
    			add_location(option2, file, 140, 7, 5022);
    			attr_dev(select, "class", "custom-select");
    			attr_dev(select, "id", "participation");
    			if (/*participation*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[9].call(select));
    			add_location(select, file, 137, 6, 4848);
    			attr_dev(div0, "class", "col-auto");
    			add_location(div0, file, 136, 5, 4819);
    			attr_dev(div1, "class", "form-group row");
    			add_location(div1, file, 132, 4, 4683);
    			attr_dev(label1, "for", "notes");
    			attr_dev(label1, "class", "col-lg-3 col-form-label");
    			add_location(label1, file, 192, 5, 6614);
    			attr_dev(textarea, "class", "form-control");
    			attr_dev(textarea, "id", "notes");
    			attr_dev(textarea, "rows", "3");
    			add_location(textarea, file, 197, 6, 6828);
    			attr_dev(div2, "class", "col");
    			add_location(div2, file, 196, 5, 6804);
    			attr_dev(div3, "class", "form-group row");
    			add_location(div3, file, 191, 4, 6580);
    			attr_dev(div4, "class", "col-lg-10");
    			add_location(div4, file, 202, 5, 6963);
    			attr_dev(div5, "class", "form-group row");
    			add_location(div5, file, 201, 4, 6929);
    			attr_dev(form, "class", "section-body");
    			add_location(form, file, 125, 3, 4523);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			if (if_block0) if_block0.m(form, null);
    			append_dev(form, t0);
    			append_dev(form, div1);
    			append_dev(div1, label0);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			select_option(select, /*participation*/ ctx[0]);
    			append_dev(form, t6);
    			if (if_block1) if_block1.m(form, null);
    			append_dev(form, t7);
    			append_dev(form, div3);
    			append_dev(div3, label1);
    			append_dev(div3, t9);
    			append_dev(div3, div2);
    			append_dev(div2, textarea);
    			set_input_value(textarea, /*notes*/ ctx[5]);
    			append_dev(form, t10);
    			append_dev(form, div5);
    			append_dev(div5, div4);
    			if_block2.m(div4, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler*/ ctx[9]),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[12]),
    					listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[8]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*errorMsg*/ 64) show_if = /*errorMsg*/ ctx[6]?.trim();

    			if (show_if) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(form, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*participation*/ 1) {
    				select_option(select, /*participation*/ ctx[0]);
    			}

    			if (/*participation*/ ctx[0] === "1") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(form, t7);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*notes*/ 32) {
    				set_input_value(textarea, /*notes*/ ctx[5]);
    			}

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block2) {
    				if_block2.p(ctx, dirty);
    			} else {
    				if_block2.d(1);
    				if_block2 = current_block_type(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(div4, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if_block2.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(125:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (102:2) {#if user?.feedback?.participation === true || user?.feedback?.participation === false}
    function create_if_block$1(ctx) {
    	let p0;
    	let t1;
    	let table;
    	let tr0;
    	let td0;
    	let td1;
    	let t3_value = (/*user*/ ctx[4].feedback.participation ? "ja" : "nein") + "";
    	let t3;
    	let t4;
    	let tr1;
    	let td2;
    	let td3;
    	let t6_value = /*user*/ ctx[4].feedback.guestsOver14Years + "";
    	let t6;
    	let t7;
    	let tr2;
    	let td4;
    	let td5;
    	let t9_value = /*user*/ ctx[4].feedback.guestsUpTo14Years + "";
    	let t9;
    	let t10;
    	let p1;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "Vielen Dank für deine Rückmeldung:";
    			t1 = space();
    			table = element("table");
    			tr0 = element("tr");
    			td0 = element("td");
    			td0.textContent = "Ich/wir komme(n):";
    			td1 = element("td");
    			t3 = text(t3_value);
    			t4 = space();
    			tr1 = element("tr");
    			td2 = element("td");
    			td2.textContent = "Anzahl Personen ab 14 Jahren:";
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			tr2 = element("tr");
    			td4 = element("td");
    			td4.textContent = "Anzahl Personen bis zu 14 Jahren:";
    			td5 = element("td");
    			t9 = text(t9_value);
    			t10 = space();
    			p1 = element("p");
    			p1.textContent = "Möchtest du an deiner Rückmeldung etwas ändern, dann melde dich bitte direkt bei\n\t\t\t\tCathe oder Holger.";
    			add_location(p0, file, 102, 3, 3954);
    			attr_dev(td0, "class", "svelte-3abdtn");
    			add_location(td0, file, 106, 6, 4044);
    			attr_dev(td1, "class", "svelte-3abdtn");
    			add_location(td1, file, 106, 32, 4070);
    			add_location(tr0, file, 105, 4, 4034);
    			attr_dev(td2, "class", "svelte-3abdtn");
    			add_location(td2, file, 110, 6, 4155);
    			attr_dev(td3, "class", "svelte-3abdtn");
    			add_location(td3, file, 110, 44, 4193);
    			add_location(tr1, file, 109, 4, 4145);
    			attr_dev(td4, "class", "svelte-3abdtn");
    			add_location(td4, file, 114, 6, 4266);
    			attr_dev(td5, "class", "svelte-3abdtn");
    			add_location(td5, file, 114, 48, 4308);
    			add_location(tr2, file, 113, 4, 4256);
    			attr_dev(table, "class", "mb-4 offset-1");
    			add_location(table, file, 104, 3, 4000);
    			add_location(p1, file, 120, 3, 4390);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, table, anchor);
    			append_dev(table, tr0);
    			append_dev(tr0, td0);
    			append_dev(tr0, td1);
    			append_dev(td1, t3);
    			append_dev(table, t4);
    			append_dev(table, tr1);
    			append_dev(tr1, td2);
    			append_dev(tr1, td3);
    			append_dev(td3, t6);
    			append_dev(table, t7);
    			append_dev(table, tr2);
    			append_dev(tr2, td4);
    			append_dev(tr2, td5);
    			append_dev(td5, t9);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, p1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*user*/ 16 && t3_value !== (t3_value = (/*user*/ ctx[4].feedback.participation ? "ja" : "nein") + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*user*/ 16 && t6_value !== (t6_value = /*user*/ ctx[4].feedback.guestsOver14Years + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*user*/ 16 && t9_value !== (t9_value = /*user*/ ctx[4].feedback.guestsUpTo14Years + "")) set_data_dev(t9, t9_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(table);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(p1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(102:2) {#if user?.feedback?.participation === true || user?.feedback?.participation === false}",
    		ctx
    	});

    	return block;
    }

    // (127:4) {#if errorMsg?.trim()}
    function create_if_block_3(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*errorMsg*/ ctx[6]);
    			attr_dev(p, "class", "error svelte-3abdtn");
    			add_location(p, file, 127, 5, 4623);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*errorMsg*/ 64) set_data_dev(t, /*errorMsg*/ ctx[6]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(127:4) {#if errorMsg?.trim()}",
    		ctx
    	});

    	return block;
    }

    // (146:4) {#if participation === '1'}
    function create_if_block_2(ctx) {
    	let div1;
    	let label0;
    	let t1;
    	let div0;
    	let select0;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let option4;
    	let option5;
    	let option6;
    	let t9;
    	let div3;
    	let label1;
    	let t11;
    	let div2;
    	let select1;
    	let option7;
    	let option8;
    	let option9;
    	let option10;
    	let option11;
    	let option12;
    	let option13;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			label0 = element("label");
    			label0.textContent = "Anzahl Personen ab 14 Jahren";
    			t1 = space();
    			div0 = element("div");
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "Auswählen…";
    			option1 = element("option");
    			option1.textContent = "0";
    			option2 = element("option");
    			option2.textContent = "1";
    			option3 = element("option");
    			option3.textContent = "2";
    			option4 = element("option");
    			option4.textContent = "3";
    			option5 = element("option");
    			option5.textContent = "4";
    			option6 = element("option");
    			option6.textContent = "5";
    			t9 = space();
    			div3 = element("div");
    			label1 = element("label");
    			label1.textContent = "Anzahl Personen bis zu 14 Jahren";
    			t11 = space();
    			div2 = element("div");
    			select1 = element("select");
    			option7 = element("option");
    			option7.textContent = "Auswählen…";
    			option8 = element("option");
    			option8.textContent = "0";
    			option9 = element("option");
    			option9.textContent = "1";
    			option10 = element("option");
    			option10.textContent = "2";
    			option11 = element("option");
    			option11.textContent = "3";
    			option12 = element("option");
    			option12.textContent = "4";
    			option13 = element("option");
    			option13.textContent = "5";
    			attr_dev(label0, "for", "guestsOver14Years");
    			attr_dev(label0, "class", "col-lg-3 col-form-label");
    			add_location(label0, file, 148, 6, 5257);
    			option0.__value = "";
    			option0.value = option0.__value;
    			option0.selected = true;
    			add_location(option0, file, 157, 8, 5533);
    			option1.__value = "0";
    			option1.value = option1.__value;
    			add_location(option1, file, 158, 8, 5587);
    			option2.__value = "1";
    			option2.value = option2.__value;
    			add_location(option2, file, 159, 8, 5624);
    			option3.__value = "2";
    			option3.value = option3.__value;
    			add_location(option3, file, 160, 8, 5661);
    			option4.__value = "3";
    			option4.value = option4.__value;
    			add_location(option4, file, 161, 8, 5698);
    			option5.__value = "4";
    			option5.value = option5.__value;
    			add_location(option5, file, 162, 8, 5735);
    			option6.__value = "5";
    			option6.value = option6.__value;
    			add_location(option6, file, 163, 8, 5772);
    			attr_dev(select0, "class", "custom-select");
    			attr_dev(select0, "id", "guestsOver14Years");
    			if (/*guestsOver14Years*/ ctx[1] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[10].call(select0));
    			add_location(select0, file, 152, 7, 5408);
    			attr_dev(div0, "class", "col-auto");
    			add_location(div0, file, 151, 6, 5378);
    			attr_dev(div1, "class", "form-group row");
    			add_location(div1, file, 147, 5, 5222);
    			attr_dev(label1, "for", "guestsUpTo14Years");
    			attr_dev(label1, "class", "col-lg-3 col-form-label");
    			add_location(label1, file, 170, 6, 5975);
    			option7.__value = "";
    			option7.value = option7.__value;
    			option7.selected = true;
    			add_location(option7, file, 179, 8, 6255);
    			option8.__value = "0";
    			option8.value = option8.__value;
    			add_location(option8, file, 180, 8, 6309);
    			option9.__value = "1";
    			option9.value = option9.__value;
    			add_location(option9, file, 181, 8, 6346);
    			option10.__value = "2";
    			option10.value = option10.__value;
    			add_location(option10, file, 182, 8, 6383);
    			option11.__value = "3";
    			option11.value = option11.__value;
    			add_location(option11, file, 183, 8, 6420);
    			option12.__value = "4";
    			option12.value = option12.__value;
    			add_location(option12, file, 184, 8, 6457);
    			option13.__value = "5";
    			option13.value = option13.__value;
    			add_location(option13, file, 185, 8, 6494);
    			attr_dev(select1, "class", "custom-select");
    			attr_dev(select1, "id", "guestsUpTo14Years");
    			if (/*guestsUpTo14Years*/ ctx[2] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[11].call(select1));
    			add_location(select1, file, 174, 7, 6130);
    			attr_dev(div2, "class", "col-auto");
    			add_location(div2, file, 173, 6, 6100);
    			attr_dev(div3, "class", "form-group row");
    			add_location(div3, file, 169, 5, 5940);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, label0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(select0, option2);
    			append_dev(select0, option3);
    			append_dev(select0, option4);
    			append_dev(select0, option5);
    			append_dev(select0, option6);
    			select_option(select0, /*guestsOver14Years*/ ctx[1]);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, label1);
    			append_dev(div3, t11);
    			append_dev(div3, div2);
    			append_dev(div2, select1);
    			append_dev(select1, option7);
    			append_dev(select1, option8);
    			append_dev(select1, option9);
    			append_dev(select1, option10);
    			append_dev(select1, option11);
    			append_dev(select1, option12);
    			append_dev(select1, option13);
    			select_option(select1, /*guestsUpTo14Years*/ ctx[2]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[10]),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[11])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*guestsOver14Years*/ 2) {
    				select_option(select0, /*guestsOver14Years*/ ctx[1]);
    			}

    			if (dirty & /*guestsUpTo14Years*/ 4) {
    				select_option(select1, /*guestsUpTo14Years*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(146:4) {#if participation === '1'}",
    		ctx
    	});

    	return block;
    }

    // (208:6) {:else}
    function create_else_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Bitte warten...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(208:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (204:6) {#if !isLoading}
    function create_if_block_1(ctx) {
    	let button;
    	let t;
    	let button_disabled_value;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text("Abschicken");
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-success");
    			button.disabled = button_disabled_value = !/*canSubmit*/ ctx[3];
    			add_location(button, file, 204, 7, 7017);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*canSubmit*/ 8 && button_disabled_value !== (button_disabled_value = !/*canSubmit*/ ctx[3])) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(204:6) {#if !isLoading}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let section;
    	let div;
    	let h2;
    	let t1;

    	function select_block_type(ctx, dirty) {
    		if (/*user*/ ctx[4]?.feedback?.participation === true || /*user*/ ctx[4]?.feedback?.participation === false) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Rückmeldung";
    			t1 = space();
    			if_block.c();
    			attr_dev(h2, "class", "text-center");
    			add_location(h2, file, 99, 2, 3819);
    			attr_dev(div, "class", "container");
    			add_location(div, file, 98, 1, 3793);
    			attr_dev(section, "id", "response");
    			attr_dev(section, "class", "section");
    			add_location(section, file, 97, 0, 3752);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function scrollTo(hash) {
    	location.hash = "#" + hash;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Response", slots, []);

    	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
    		function adopt(value) {
    			return value instanceof P
    			? value
    			: new P(function (resolve) {
    						resolve(value);
    					});
    		}

    		return new (P || (P = Promise))(function (resolve, reject) {
    				function fulfilled(value) {
    					try {
    						step(generator.next(value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function rejected(value) {
    					try {
    						step(generator["throw"](value));
    					} catch(e) {
    						reject(e);
    					}
    				}

    				function step(result) {
    					result.done
    					? resolve(result.value)
    					: adopt(result.value).then(fulfilled, rejected);
    				}

    				step((generator = generator.apply(thisArg, _arguments || [])).next());
    			});
    	};

    	let user$1; //: UserInfo;

    	user.subscribe(value => {
    		$$invalidate(4, user$1 = value);
    	});

    	// form data
    	let participation;

    	let guestsOver14Years;
    	let guestsUpTo14Years;
    	let notes = "";
    	let errorMsg = "";
    	let isLoading = false;
    	let canSubmit;

    	function handleSubmit() {
    		return __awaiter(this, void 0, void 0, function* () {
    			$$invalidate(6, errorMsg = "");
    			$$invalidate(7, isLoading = true);
    			const dto = getDto();

    			try {
    				const response = yield fetch(ENDPOINT.respond, {
    					method: "POST",
    					headers: { "Content-Type": "application/json" },
    					body: JSON.stringify(dto)
    				});

    				if (!response.ok) {
    					throw new Error();
    				} else {
    					console.clear(); // TODO emtf
    					const foo = getCookieValue(USER_INFO); // TODO emtf
    					console.log(JSON.stringify(JSON.parse(foo), null, 4)); // TODO emtf

    					// console.log('ggg'); // TODO emtf
    					// console.log(JSON.stringify(user, null, 4)); // TODO emtf
    					user.set(Object.assign(Object.assign({}, user$1), {
    						feedback: {
    							participation: dto.participation,
    							guestsOver14Years: dto.guestsOver14Years,
    							guestsUpTo14Years: dto.guestsUpTo14Years
    						}
    					}));

    					setCookie(USER_INFO, JSON.stringify(user$1));

    					// console.log(JSON.stringify(user, null, 4)); // TODO emtf
    					const bar = getCookieValue(USER_INFO); // TODO emtf

    					console.log(JSON.stringify(JSON.parse(bar), null, 4)); // TODO emtf
    					scrollTo("response");
    					return;
    				}
    			} catch(err) {
    				$$invalidate(6, errorMsg = "Hoppla, da ging was schief… Probiere es doch noch einmal. Wenn du weiterhin Probleme hast, wende dich bitte an Cathe oder Holger.");
    			}

    			$$invalidate(7, isLoading = false);
    		});
    	}

    	function getDto() {
    		if (isNaN(parseInt(guestsOver14Years, 10))) $$invalidate(1, guestsOver14Years = "0");
    		if (isNaN(parseInt(guestsUpTo14Years, 10))) $$invalidate(2, guestsUpTo14Years = "0");
    		const { username, hashedUsernamePassword } = user$1;

    		const dto = {
    			username,
    			hashedUsernamePassword,
    			participation: participation === "1",
    			guestsOver14Years: parseInt(guestsOver14Years, 10),
    			guestsUpTo14Years: parseInt(guestsUpTo14Years, 10),
    			notes
    		};

    		if (dto.participation === false) {
    			dto.guestsOver14Years = 0;
    			dto.guestsUpTo14Years = 0;
    		}

    		return dto;
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Response> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		participation = select_value(this);
    		$$invalidate(0, participation);
    	}

    	function select0_change_handler() {
    		guestsOver14Years = select_value(this);
    		$$invalidate(1, guestsOver14Years);
    	}

    	function select1_change_handler() {
    		guestsUpTo14Years = select_value(this);
    		$$invalidate(2, guestsUpTo14Years);
    	}

    	function textarea_input_handler() {
    		notes = this.value;
    		$$invalidate(5, notes);
    	}

    	$$self.$capture_state = () => ({
    		__awaiter,
    		ENDPOINT,
    		USER_INFO,
    		userFromStore: user,
    		getCookieValue,
    		setCookie,
    		user: user$1,
    		participation,
    		guestsOver14Years,
    		guestsUpTo14Years,
    		notes,
    		errorMsg,
    		isLoading,
    		canSubmit,
    		handleSubmit,
    		scrollTo,
    		getDto
    	});

    	$$self.$inject_state = $$props => {
    		if ("__awaiter" in $$props) __awaiter = $$props.__awaiter;
    		if ("user" in $$props) $$invalidate(4, user$1 = $$props.user);
    		if ("participation" in $$props) $$invalidate(0, participation = $$props.participation);
    		if ("guestsOver14Years" in $$props) $$invalidate(1, guestsOver14Years = $$props.guestsOver14Years);
    		if ("guestsUpTo14Years" in $$props) $$invalidate(2, guestsUpTo14Years = $$props.guestsUpTo14Years);
    		if ("notes" in $$props) $$invalidate(5, notes = $$props.notes);
    		if ("errorMsg" in $$props) $$invalidate(6, errorMsg = $$props.errorMsg);
    		if ("isLoading" in $$props) $$invalidate(7, isLoading = $$props.isLoading);
    		if ("canSubmit" in $$props) $$invalidate(3, canSubmit = $$props.canSubmit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*participation, canSubmit, guestsOver14Years, guestsUpTo14Years*/ 15) {
    			{
    				$$invalidate(3, canSubmit = participation !== "");

    				if (canSubmit && participation === "1") {
    					$$invalidate(3, canSubmit = guestsOver14Years !== "" && guestsUpTo14Years !== "");
    				}
    			}
    		}
    	};

    	return [
    		participation,
    		guestsOver14Years,
    		guestsUpTo14Years,
    		canSubmit,
    		user$1,
    		notes,
    		errorMsg,
    		isLoading,
    		handleSubmit,
    		select_change_handler,
    		select0_change_handler,
    		select1_change_handler,
    		textarea_input_handler
    	];
    }

    class Response extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Response",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.38.2 */

    const { console: console_1 } = globals;

    // (44:0) {:else}
    function create_else_block(ctx) {
    	let navbar;
    	let t0;
    	let welcome;
    	let t1;
    	let schedule;
    	let t2;
    	let location;
    	let t3;
    	let sleep;
    	let t4;
    	let gifts;
    	let t5;
    	let response;
    	let t6;
    	let news;
    	let t7;
    	let footer;
    	let current;
    	navbar = new Navbar({ $$inline: true });
    	welcome = new Welcome({ $$inline: true });
    	schedule = new Schedule({ $$inline: true });
    	location = new Location({ $$inline: true });
    	sleep = new Sleep({ $$inline: true });
    	gifts = new Gifts({ $$inline: true });
    	response = new Response({ $$inline: true });
    	news = new News({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			create_component(welcome.$$.fragment);
    			t1 = space();
    			create_component(schedule.$$.fragment);
    			t2 = space();
    			create_component(location.$$.fragment);
    			t3 = space();
    			create_component(sleep.$$.fragment);
    			t4 = space();
    			create_component(gifts.$$.fragment);
    			t5 = space();
    			create_component(response.$$.fragment);
    			t6 = space();
    			create_component(news.$$.fragment);
    			t7 = space();
    			create_component(footer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(navbar, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(welcome, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(schedule, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(location, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(sleep, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(gifts, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(response, target, anchor);
    			insert_dev(target, t6, anchor);
    			mount_component(news, target, anchor);
    			insert_dev(target, t7, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(welcome.$$.fragment, local);
    			transition_in(schedule.$$.fragment, local);
    			transition_in(location.$$.fragment, local);
    			transition_in(sleep.$$.fragment, local);
    			transition_in(gifts.$$.fragment, local);
    			transition_in(response.$$.fragment, local);
    			transition_in(news.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(welcome.$$.fragment, local);
    			transition_out(schedule.$$.fragment, local);
    			transition_out(location.$$.fragment, local);
    			transition_out(sleep.$$.fragment, local);
    			transition_out(gifts.$$.fragment, local);
    			transition_out(response.$$.fragment, local);
    			transition_out(news.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navbar, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(welcome, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(schedule, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(location, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(sleep, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(gifts, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(response, detaching);
    			if (detaching) detach_dev(t6);
    			destroy_component(news, detaching);
    			if (detaching) detach_dev(t7);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(44:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (42:0) {#if !isSignedIn}
    function create_if_block(ctx) {
    	let login;
    	let current;
    	login = new Login({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(login.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(login, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(login.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(login.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(login, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(42:0) {#if !isSignedIn}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*isSignedIn*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	
    	let isSignedIn = false;

    	function checkLogin() {
    		try {
    			const cookie = JSON.parse(getCookieValue(USER_INFO));
    			const { username, hashedUsernamePassword } = cookie;

    			// We assume that if the cookie exists and has values set for `username` and 
    			// `hashedUsernamePassword` the user has successfully logged in before and the cookie 
    			// contains all the data from `UserInfo`
    			if (username.trim() && hashedUsernamePassword.trim()) {
    				// TODO entf.
    				// cookie.feedback && (cookie.feedback.participation = undefined);
    				user.set(cookie);

    				$$invalidate(0, isSignedIn = true);
    				const isJimmy = username === "g44";
    				if (isJimmy) new Audio("https://assets.schwarz/scs/images/chatbot-widget/martinshorn.mp3").play();
    				return;
    			}
    		} catch(err) {
    			console.log(err);
    		}

    		setCookie(USER_INFO, ""); // "remove" cookie
    	}

    	checkLogin();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Navbar,
    		Footer,
    		Welcome,
    		Schedule,
    		Location,
    		Sleep,
    		Gifts,
    		News,
    		Login,
    		Response,
    		getCookieValue,
    		setCookie,
    		user,
    		USER_INFO,
    		isSignedIn,
    		checkLogin
    	});

    	$$self.$inject_state = $$props => {
    		if ("isSignedIn" in $$props) $$invalidate(0, isSignedIn = $$props.isSignedIn);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [isSignedIn];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    fetch(ENDPOINT.ping); // wake up server (if it sleeps)
    const app = new App({
        target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
