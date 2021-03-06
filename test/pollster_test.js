(function() {
  /*
    ======== A Handy Little QUnit Reference ========
    http://api.qunitjs.com/

    Test methods:
      module(name, {[setup][ ,teardown]})
      test(name, callback)
      expect(numberOfAssertions)
      stop(increment)
      start(decrement)
    Test assertions:
      ok(value, [message])
      equal(actual, expected, [message])
      notEqual(actual, expected, [message])
      deepEqual(actual, expected, [message])
      notDeepEqual(actual, expected, [message])
      strictEqual(actual, expected, [message])
      notStrictEqual(actual, expected, [message])
      throws(block, [expected], [message])
  */

  module('pollster', {
    setup: function () {
      this.makeServer = function () {
        this.server = this.sandbox.useFakeServer();
        this.server.respondWith([200, { "Content-Type": "application/json" },
                           '["item1", "item2"]']);
      };
      this.waitAndRespond = function (delay) {
        this.clock.tick(delay || 30 * 1000);
        this.server.respond();
      };
    }
  });

  test('is a function', function() {
    expect(1);
    ok(typeof Pollster === 'function');
  });

  test('there is a jQuery function', function() {
    expect(0);
    jQuery.pollster('/pint', function () { });
  });

  test('polls at least once', function() {
    expect(1);
    this.makeServer();
    var callback = this.spy();
    new Pollster('/ping', callback);
    this.waitAndRespond();
    ok(callback.calledOnce);
  });

  test('callback recieves data from server', function() {
    expect(1);
    this.makeServer();
    var callback = this.spy();
    new Pollster('/ping', callback);
    this.waitAndRespond();
    strictEqual(callback.args[0][0].length, 2);
  });

  test('stops polling when the callback returns true', function() {
    expect(1);
    this.makeServer();
    var response = false;
    var callback = function () {
      return response;
    };
    callback = this.spy(callback);
    new Pollster('/ping', callback);
    this.waitAndRespond();
    response = true;
    this.waitAndRespond();
    this.waitAndRespond();

    ok(callback.calledTwice);
  });

  test('stops polling on server error', function() {
    expect(1);
    this.makeServer();
    var callback = this.spy();
    new Pollster('/ping', callback);
    this.waitAndRespond();
    this.server.respondWith([500, {}, ""]);
    this.waitAndRespond();
    ok(callback.calledOnce);
  });

  test('continues polling on error if continue_on_error is set', function() {
    expect(1);
    this.makeServer();
    var callback = this.spy();
    new Pollster('/ping', callback, {
      continue_on_error: true
    });
    this.waitAndRespond();
    this.server.respondWith([500, {}, ""]);
    this.waitAndRespond();
    this.server.respondWith([200, {}, "[]"]);
    this.waitAndRespond();
    ok(callback.calledTwice);
  });

  test('calls on_error on error', function() {
    expect(1);
    this.makeServer();
    var callback = this.spy();
    new Pollster('/ping', function () { }, {
      on_error: callback
    });
    this.server.respondWith([500, {}, ""]);
    this.waitAndRespond();
    ok(callback.calledOnce);
  });

  test('calls on_complete on success or error', function() {
    expect(1);
    this.makeServer();
    var callback = this.spy();
    new Pollster('/ping', function () { }, {
      on_complete: callback
    });
    this.waitAndRespond();
    this.server.respondWith([500, {}, ""]);
    this.waitAndRespond();
    ok(callback.calledTwice);
  });

  test('multiple instances do not conflict', function() {
    expect(1);
    this.makeServer();
    var callback = this.spy();
    new Pollster('/ping', function () { return true; });
    new Pollster('/ping', callback);
    this.waitAndRespond();
    this.waitAndRespond();
    ok(callback.calledTwice);
  });

  test('the delay can be changed', function() {
    expect(1);
    var delay = 60 * 1000;
    this.makeServer();
    var callback = this.spy();
    new Pollster('/ping', callback, { delay: delay });
    this.server.respond();
    this.waitAndRespond();
    this.waitAndRespond(delay);
    ok(callback.calledTwice);
  });

}(jQuery));
