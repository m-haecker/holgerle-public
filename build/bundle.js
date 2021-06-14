
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
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
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
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
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

    const file$2 = "src/components/navbar/Navbar.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (26:4) {#each items as item}
    function create_each_block(ctx) {
    	let li;
    	let a;
    	let t0_value = /*item*/ ctx[2].label + "";
    	let t0;
    	let a_href_value;
    	let t1;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(a, "class", "nav-link svelte-1nu8gh3");
    			attr_dev(a, "href", a_href_value = /*item*/ ctx[2].url);
    			add_location(a, file$2, 27, 6, 655);
    			attr_dev(li, "class", "nav-item");
    			add_location(li, file$2, 26, 5, 627);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t0);
    			append_dev(li, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*items*/ 1 && t0_value !== (t0_value = /*item*/ ctx[2].label + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*items*/ 1 && a_href_value !== (a_href_value = /*item*/ ctx[2].url)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(26:4) {#each items as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let section;
    	let nav;
    	let a;
    	let t0;
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
    			t0 = text(/*header*/ ctx[1]);
    			t1 = space();
    			button = element("button");
    			span = element("span");
    			t2 = space();
    			div = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(a, "class", "navbar-brand svelte-1nu8gh3");
    			attr_dev(a, "href", "/");
    			add_location(a, file$2, 7, 2, 199);
    			attr_dev(span, "class", "navbar-toggler-icon");
    			add_location(span, file$2, 20, 3, 455);
    			attr_dev(button, "class", "navbar-toggler");
    			attr_dev(button, "type", "button");
    			attr_dev(button, "data-toggle", "collapse");
    			attr_dev(button, "data-target", "#navbarNav");
    			attr_dev(button, "aria-controls", "navbarNav");
    			attr_dev(button, "aria-expanded", "false");
    			attr_dev(button, "aria-label", "Toggle navigation");
    			add_location(button, file$2, 11, 2, 255);
    			attr_dev(ul, "class", "navbar-nav ml-auto svelte-1nu8gh3");
    			add_location(ul, file$2, 24, 3, 564);
    			attr_dev(div, "class", "collapse navbar-collapse");
    			attr_dev(div, "id", "navbarNav");
    			add_location(div, file$2, 23, 2, 507);
    			attr_dev(nav, "class", "navbar navbar-expand-lg navbar-light bg-light svelte-1nu8gh3");
    			add_location(nav, file$2, 5, 1, 95);
    			attr_dev(section, "id", "nav-bar");
    			attr_dev(section, "class", "svelte-1nu8gh3");
    			add_location(section, file$2, 4, 0, 71);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, nav);
    			append_dev(nav, a);
    			append_dev(a, t0);
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
    			if (dirty & /*header*/ 2) set_data_dev(t0, /*header*/ ctx[1]);

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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Navbar", slots, []);
    	let { items = [] } = $$props;
    	let { header } = $$props;
    	const writable_props = ["items", "header"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("header" in $$props) $$invalidate(1, header = $$props.header);
    	};

    	$$self.$capture_state = () => ({ items, header });

    	$$self.$inject_state = $$props => {
    		if ("items" in $$props) $$invalidate(0, items = $$props.items);
    		if ("header" in $$props) $$invalidate(1, header = $$props.header);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [items, header];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { items: 0, header: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*header*/ ctx[1] === undefined && !("header" in props)) {
    			console.warn("<Navbar> was created without expected prop 'header'");
    		}
    	}

    	get items() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set items(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get header() {
    		throw new Error("<Navbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set header(value) {
    		throw new Error("<Navbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/footer/Footer.svelte generated by Svelte v3.38.2 */

    const file$1 = "src/components/footer/Footer.svelte";

    function create_fragment$2(ctx) {
    	let section;
    	let img;
    	let img_src_value;
    	let t0;
    	let div4;
    	let div3;
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

    	const block = {
    		c: function create() {
    			section = element("section");
    			img = element("img");
    			t0 = space();
    			div4 = element("div");
    			div3 = element("div");
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
    			if (img.src !== (img_src_value = "images/wave2.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "wave-img svelte-17zm3e5");
    			add_location(img, file$1, 3, 1, 52);
    			attr_dev(p0, "class", "title svelte-17zm3e5");
    			add_location(p0, file$1, 8, 4, 209);
    			attr_dev(div0, "class", "col-md-4");
    			add_location(div0, file$1, 7, 3, 182);
    			attr_dev(p1, "class", "title svelte-17zm3e5");
    			add_location(p1, file$1, 12, 4, 281);
    			add_location(br0, file$1, 14, 25, 357);
    			add_location(br1, file$1, 14, 47, 379);
    			add_location(p2, file$1, 13, 4, 328);
    			attr_dev(div1, "class", "col-md-4");
    			add_location(div1, file$1, 11, 3, 254);
    			attr_dev(p3, "class", "title svelte-17zm3e5");
    			add_location(p3, file$1, 19, 4, 454);
    			attr_dev(i0, "class", "fas fa-phone");
    			add_location(i0, file$1, 21, 5, 496);
    			attr_dev(a0, "href", "tel:491738370427");
    			add_location(a0, file$1, 22, 5, 528);
    			add_location(p4, file$1, 20, 4, 487);
    			attr_dev(i1, "class", "fas fa-envelope");
    			add_location(i1, file$1, 25, 5, 601);
    			attr_dev(a1, "href", "mailto:holger.freudenberger@freenet.de");
    			add_location(a1, file$1, 26, 5, 636);
    			add_location(p5, file$1, 24, 4, 592);
    			attr_dev(div2, "class", "col-md-4");
    			add_location(div2, file$1, 18, 3, 427);
    			attr_dev(div3, "class", "row justify-content-md-center");
    			add_location(div3, file$1, 6, 2, 135);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$1, 5, 1, 109);
    			attr_dev(section, "id", "footer");
    			attr_dev(section, "class", "svelte-17zm3e5");
    			add_location(section, file$1, 2, 0, 29);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, img);
    			append_dev(section, t0);
    			append_dev(section, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, p0);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			append_dev(div1, p1);
    			append_dev(div1, t4);
    			append_dev(div1, p2);
    			append_dev(p2, t5);
    			append_dev(p2, br0);
    			append_dev(p2, t6);
    			append_dev(p2, br1);
    			append_dev(p2, t7);
    			append_dev(div3, t8);
    			append_dev(div3, div2);
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/welcome/Welcome.svelte generated by Svelte v3.38.2 */

    const file = "src/components/welcome/Welcome.svelte";

    function create_fragment$1(ctx) {
    	let section;
    	let div3;
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			section = element("section");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "FOO";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "BAR";
    			t3 = space();
    			img = element("img");
    			attr_dev(div0, "class", "col-md-6");
    			add_location(div0, file, 5, 3, 100);
    			attr_dev(div1, "class", "col-md-6");
    			add_location(div1, file, 6, 3, 135);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file, 4, 2, 79);
    			attr_dev(div3, "class", "container");
    			add_location(div3, file, 3, 1, 53);
    			if (img.src !== (img_src_value = "images/wave1.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "wave-img svelte-65wrwl");
    			add_location(img, file, 10, 1, 186);
    			attr_dev(section, "id", "welcome");
    			attr_dev(section, "class", "svelte-65wrwl");
    			add_location(section, file, 2, 0, 29);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(section, t3);
    			append_dev(section, img);
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
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
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
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Welcome",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    const HEADER = 'Catharin & Holger';
    const NAVBAR_ITEMS = [
        { id: 0, url: '/', label: 'Begrüßung' },
        { id: 1, url: '#procedure', label: 'Ablauf' },
        { id: 2, url: '#location', label: 'Location' },
        { id: 3, url: '#sleep', label: 'Übernachten' },
        { id: 4, url: '#response', label: 'Rückmeldung' },
        { id: 5, url: '#gifts', label: 'Geschenke' },
        // TODO: Fotos
    ];
    // ----------
    // TODO obherhalb dieser linie sind die Daten ok
    // ----------
    const BANNER_DATA = {
        HEADING: 'Go digital with nixalar',
        DECRIPTION: 'Nixalar can help you skyrocket the ROI of your marketing campaign without having to spend tons of money or time to assemble an in-house team.',
        TUTORIAL_URL: 'https://www.thinkwithgoogle.com/intl/en-gb/marketing-resources/programmatic/google-digital-academy/',
        WATCH_TUTORIAL: 'Watch Tutorials',
    };
    const SERVICE_DATA = {
        HEADING: 'Our Services',
        ALL_SERVICES: 'All Services',
        SERVICE_LIST: [
            {
                LABEL: 'Search Engine Optimisation',
                DESCRIPTION: 'To customise the content, technical functionality and scope of your website so that your pages show for a specific set of keyword at the top of a search engine list. In the end, the goal is to attract traffic to your website when they are searching for goods, services or business-related information.',
                URL: 'images/service1.png',
            },
            {
                LABEL: 'Content Marketing Strategy',
                DESCRIPTION: 'It is tough but well worth the effort to create clever material that is not promotional in nature, but rather educates and inspires. It lets them see you as a reliable source of information by delivering content that is meaningful to your audience.',
                URL: 'images/service2.png',
            },
            {
                LABEL: 'Develop Social Media Strategy',
                DESCRIPTION: 'Many People rely on social networks to discover, research, and educate themselves about a brand before engaging with that organization. The more your audience wants to engage with your content, the more likely it is that they will want to share it.',
                URL: 'images/service3.png',
            },
        ],
    };
    const ABOUT_DATA = {
        HEADING: 'Why choose us?',
        TITLE: "Why we're different",
        IMAGE_URL: 'images/network.png',
        WHY_CHOOSE_US_LIST: [
            'We provides Cost-Effective Digital Marketing than Others.',
            'High customer statisfaction and experience.',
            'Marketing efficiency and quick time to value.',
            'Clear & transparent fee structure.',
            'We provides Marketing automation which is an integral platform that ties all of your digital marketing together.',
            'A strong desire to establish long lasting business partnerships.',
            'Provide digital marketing to mobile consumer.',
            'We provides wide range to services in reasonable prices',
        ],
    };
    const TESTIMONIAL_DATA = {
        HEADING: 'What clients say?',
        TESTIMONIAL_LIST: [
            {
                DESCRIPTION: 'Nixalar has made a huge difference to our business with his good work and knowledge of SEO and business to business marketing techniques. Our search engine rankings are better than ever and we are getting more people contacting us thanks to Jomer’s knowledge and hard work.',
                IMAGE_URL: 'images/user1.jpg',
                NAME: 'Julia hawkins',
                DESIGNATION: 'Co-founder at ABC',
            },
            {
                DESCRIPTION: 'Nixalar and his team have provided us with a comprehensive, fast and well planned digital marketing strategy that has yielded great results in terms of content, SEO, Social Media. His team are a pleasure to work with, as well as being fast to respond and adapt to the needs of your brand.',
                IMAGE_URL: 'images/user2.jpg',
                NAME: 'John Smith',
                DESIGNATION: 'Co-founder at xyz',
            },
        ],
    };
    const SOCIAL_DATA = {
        HEADING: 'Find us on social media',
        IMAGES_LIST: [
            'images/facebook-icon.png',
            'images/instagram-icon.png',
            'images/whatsapp-icon.png',
            'images/twitter-icon.png',
            'images/linkedin-icon.png',
            'images/snapchat-icon.png',
        ],
    };
    const MOCK_DATA = {
        HEADER,
        NAVBAR_ITEMS,
        BANNER_DATA,
        SERVICE_DATA,
        ABOUT_DATA,
        TESTIMONIAL_DATA,
        SOCIAL_DATA,
    };

    /* src/App.svelte generated by Svelte v3.38.2 */

    function create_fragment(ctx) {
    	let navbar;
    	let t0;
    	let welcome;
    	let t1;
    	let footer;
    	let current;

    	navbar = new Navbar({
    			props: {
    				items: MOCK_DATA.NAVBAR_ITEMS,
    				header: MOCK_DATA.HEADER
    			},
    			$$inline: true
    		});

    	welcome = new Welcome({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			create_component(welcome.$$.fragment);
    			t1 = space();
    			create_component(footer.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(navbar, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(welcome, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(welcome.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(welcome.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navbar, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(welcome, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(footer, detaching);
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
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Navbar, Footer, Welcome, DATA: MOCK_DATA });
    	return [];
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

    const app = new App({
        target: document.body,
        props: {
        // name: 'world', TODO
        },
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
