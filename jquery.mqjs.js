/**
 * jQuery Media Queries
 * Copyright (c) 2014 Andrew Mullins
 * Dual licensed: MIT/GPL
 */
;(function(window, undefined){

    var _breakpoints = {},
        M = window.Modernizr || {
            mq : function(q) { return window.matchMedia(q).matches; }
        };

    /**
     * @param name The breakpoint name.
     * @param query The media query this breakpoint represents.
     */
    var BP = function(name, query) {
        var self = this,
            _inited = {'is':false,'not':false},
            _active = {'is':false,'not':false};

        this.name = name;
        this.query = query;
        this.funcs = []; // array of BPFuncs

        var _set = function(o, m, v) { if (v != undefined) { o[m] = v; return v; } return o[m]; };

        this.active = function(m,v) { return _set(_active, m, v); };

        this.inited = function(m,v) { return _set(_inited, m, v); };

        /**
         * Get matching funcs.
         * @param where One of 'init' | 'match' | 'unmatch'
         * @param mode One of 'is' | 'not'
         */
        this.getFuncs = function(where, mode) {
            return $.grep(self.funcs, function(func) {
                return (func.when == where) && (func.mode == mode);
            });
        };

        /**
         * Test query under a specific mode.
         * @param mode One of 'is' | 'not'
         * @returns True if query matches under supplied mode.
         */
        this.test = function(mode) {
            var r = M.mq(self.query);
            return mode == 'is' ? r : !r;
        };

        var _testAndFire = function(mode) {
            var match = self.test(mode),
                a = self.active(mode), // catch the current state before we change it
                initFuncs = self.getFuncs('init', mode);

            self.active(mode, match);

            if ((match && a) || (!match && !a)) return; // prevent funcs from running unnecessarily

            // do extra stuff for first match
            if (match && !self.inited(mode) && initFuncs.length) {
                var doBreak = false; // if one of the firstMatchFuncs returns false, do not continue on to the normal onMatchFuncs
                $.each(initFuncs, function(i, bpfunc) {
                    var b = bpfunc.func.call(self, self);
                    if (b === false) doBreak = true;
                });
                self.inited(mode, true);
                if (doBreak) return;
            }

            $.each(self.getFuncs(match ? 'match' : 'unmatch', mode), function(i, bpfunc) {
                bpfunc.func.call(self, self);
            });
        };

        this.testAndFire = function() {
            _testAndFire('is');
            _testAndFire('not');
        };
    };

    /**
     * @param mode Determines nuder which match mode this func will run. 'is' | 'not'
     * @param when When to run this func. 'init' | 'match' | 'unmatch'
     * @param func The function to run.
     */
    var BPFunc = function(mode, when, func) {
        this.mode = mode;
        this.when = when;
        this.func = func;
    };

    /**
     * @param query The query to be parsed. "{is:not}:{breakpoint name or media query}"
     */
    var BPQuery = function(query) {
        var parts = query.split(':'), self = this;

        // if mode is not specified in query, 'is' is assumed
        this.mode = (parts.length == 1 || $.trim(parts[0]) == 'is') ? 'is' : 'not';
        this.query = $.trim(parts.slice(1).join(':'));

        this.getBreakpoint = function() {
            return _breakpoints[self.query];
        };
    };


    $.mq = function(opts) {
        var args = Array.prototype.slice.call(arguments),
            arg1 = args[0],
            len = args.length,
            query = (typeof arg1 == 'string') ? new BPQuery(arg1) : null,
            bp = null;


        // run once - if needed
        this.runOnce = function() {
            runIt();
        };


        // $.mq('call:runOnce', some, arguments, go, here); // call a method
        if (typeof arg1 == 'string' && arg1.indexOf('call:') == 0) {
            var func = this[arg1.substr(5)];
            if ($.isFunction(func)) return func.apply(this, args.slice(1));
        }

        // $.mq('small', function(breakpoint) {});
        // $.mq('small', { onMatch : function(breakpoint) {}, onUnmatch : function(breakpoint) {} });
        // $.mq('(max-width: 500px)', function(breakpoint) {});
        // $.mq('small', function(breakpoint) {}, true); // tests immediately instead of waiting on window resize
        if (typeof arg1 == 'string' && len > 1) {
            var obj = {},
                existing = query.getBreakpoint();

            if (existing) {
                obj = $.isFunction(args[1]) ? {'onmatch':args[1]} : args[1];
                $.each(obj, function(key, value) {
                    if ($.isFunction(value)) {
                        existing.funcs.push(new BPFunc(query.mode, key.toLowerCase().slice(2), value));
                    }
                });
                bp = existing;

            // query is a media query instead of a breakpoint name
            } else {
                var n = 'query-' + _breakpoints.length;
                obj[n] = query.query;
                bp = $.mq(obj).mq(query.mode + ':' + n, args[1]);
            }

            if (args[2] === true) bp.testAndFire();


        // $.mq('small'); // defaults to 'is'
        // $.mq('is:small');
        // $.mq('not:small');
        // $.mq('is:only screen and (min-width: 320px)');
        } else if (typeof arg1 == 'string' && len == 1) {
            bp = query.getBreakpoint();
            if (bp) return bp.test(query.mode);
            var r = M.mq(query.query);
            return query.mode == 'is' ? r : !r;


        // $.mq({ 'small' : '(max-width: 480px)', 'large' : '(max-width: 960px)' });
        } else if (len == 1 && $.isPlainObject(arg1)) {
            // append new breakpoints
            $.each(arg1, function(name, value) {
                _breakpoints[name] = new BP(name, value);
            });
        }

        return $;
    };


    function runIt() {
        $.each(_breakpoints, function(key, bp) { bp.testAndFire(); });
    }


    $(function() {
        $(window).resize(runIt);
    });

})(window);