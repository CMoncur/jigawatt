/*eslint-env node, mocha */
const _ = require('ramda');
const expect = require('chai').expect;

const JW     = require('../index.js');


const basic_middleware = {

  awesomize: (v) => ({
    foo: {
      validate: [ v.required ]
    }
  })

, io: (req, data) => ({ bar: data.foo })

, transform: (req, data) => data
};


const fail_res = {
  json: (x) => { throw Error(`Unexpected: ${x}`); }
}

describe('jigawatt/index.js', () => {

  it('should be a function', () => expect(JW).to.be.a('function'));

  
  it('should throw an error when not given any arguments', () => {

    const test = () => JW();

    expect(test).to.throw(
      TypeError
    , /You must provide at least one middleware/
    );

  });


  it('should call the validation function of the given middleware using ' +
  'the awesomize module', (done) => {

    const req = {};

    const test = JW(basic_middleware);

    test(req, fail_res, (err) => {
      expect(err).to.not.be.undefined;
      expect(err.name).to.eql('ValidationError');
      expect(err.validation.foo).to.eql('required');
      done();
    });

  });

  it('should pass the output of the awesomizer as `data` to the IO ' +
  'function', (done) => {

    const req  = { foo: 'bar' };
    const mw   = _.merge(basic_middleware, {
      io: (req, data) => {
        expect(data.foo).to.eql('bar');

        return data;
      }

    });
    const test = JW(mw);

    const res  = {
      json: (data) => {
        expect(data.foo).to.eql('bar');
        done();

      }
    };

    test(req, res, done);

  });


  it('should pass the new request object to the second middleware', (done) => {

    const req = { foo: 'bar' };
    const mw1 = _.merge(basic_middleware, {
      io: (req, data) => {
        expect(data.foo).to.eql('bar');

        return { bar: 'baz' };
      }
    });
    const mw2 = _.merge(basic_middleware, {
      awesomize: (v) => ({
        bar: {
          read: _.path([ 'data', 'bar' ])
        , validate: [ v.required ]
        }
      })
    , io: (req, data) => ({ boo: data.bar })
    });

    const test = JW(mw1, mw2);

    const res = {
      json: (data) => {

        expect(data.bar).to.eql('baz');
        expect(data.boo).to.eql('baz');
        done();

      }
    };

    test(req, res, done);

  });


  it('should run arrays of middleware in parallel', (done) => {

    const req = { foo: 'bar' };
    const mw1 = _.merge(basic_middleware, {
      io: () => ({ bar: 'Chic-fil-a' })
    });
    const mw2 = _.merge(basic_middleware, {
      io: () => ({ boo: 'Wendy\'s' })
    });
    const mw3 = _.merge(basic_middleware, {
      io: () => ({ buzz: 'Chipotle' })
    });
    const mw4 = _.merge(basic_middleware, {
      io: () => ({ fuzz: 'In-n-Out' })
    });

    const test = JW(mw1, [mw2, mw3], mw4);

    const res = {
      json: (data) => {
        expect(data.bar).to.eql('Chic-fil-a');
        expect(data.boo).to.eql('Wendy\'s');
        expect(data.buzz).to.eql('Chipotle');
        expect(data.fuzz).to.eql('In-n-Out');
        done()
      }
    };

    test(req, res, done);
  });


  it('should pass in the req.data object if no awesomize function is ' +
  'provided', (done) => {
    const req = { foo: 'bar', data: { bar: 'blah' }};
    const mw1 = {
      io: (req, data) => {
        expect(data.bar).to.eql('blah');
        return data;
      }
    };

    const test = JW(mw1);

    const res = {
      json: (data) => {
        expect(data.bar).to.eql('blah');
        done();
      }
    };

    test(req, res, done);

  });


  it('should pass the data to transform if no io function is provided',
  (done) => {
    const req = { foo: 'bar' };
    const mw = _.omit(['io'], basic_middleware);

    const test = JW(mw);

    const res = {
      json: (data) => {
        expect(data).to.deep.eql(req);
        done();
      }
    }

    test(req, res, done);
  });


  it.skip('should throw a TypeError if one of the items is not a function',
  () => {

    const f1   = () => null;
    const f2   = () => null;
    const test = () => JW(f1, 'foo', f2);
    const message = 'All middleware given must be functions - index: 1'

    expect(test).to.throw(TypeError, message);

  });

  it.skip('should throw an exception if a sub-item is not a function',
  () => {
    const f1 = () => null;
    const f2 = () => null;
    const f3 = () => null;
    const test = () => JW(f1, [f2, 'foo'], f3);
    const message = 'All middleware given must be functions - index: 1:1'

    expect(test).to.throw(TypeError, message);

  });

  it.skip('should throw an exception if a sub-sub-item is not a function',
  () => {
    const f1 = () => null;
    const f2 = () => null;
    const f3 = () => null;
    const f4 = () => null;
    const f5 = () => null;
    const test = () => JW([f2, [f4, f5, 'foo']], f1, f3);
    const message = 'All middleware given must be functions - index: 0:1:2'

    expect(test).to.throw(TypeError, message);
  });


  it('should return a function with an arity of 3 when given one argument ' +
  'that is a function', () => {

    const actual = JW(() => null);
    expect(actual).to.be.a('function');
    expect(actual.length).to.eql(3);

  });


  it('should return a PropsCheckError when a middleware has invalid keys'
    , () => {

      const m1 = {
        awesomize: (v) => ({ foo: { validate: [ v.required ] } })
      , io: (req, data) => ({ bar: data.foo })
      , transform: (req, data) => data
      };

      const m2 = {
        awesomize: (v) => ({ foo: { validate: [ v.required ] } })
      , io: (req, data) => ({ bar: data.foo })
      };

      const m3 = {
        awesomizer: (v) => ({ foo: { validate: [ v.required ] } })
      , io: (req, data) => ({ bar: data.foo })
      };

      const test1 = () => JW(m3);
      expect(test1).to.throw(Error);

      const test2 = () => JW(m1, [m2, m3]);
      expect(test2).to.throw(Error);

  });

});
