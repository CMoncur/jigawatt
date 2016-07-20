/*eslint-env node, mocha */
const expect = require('chai').expect;

const MW     = require('../index.js');

describe('ifpem/index.js', () => {

  it('should be a function', () => expect(MW).to.be.a('function'));

  
  it('should throw an error when not given any arguments', () => {

    const test = () => MW();

    expect(test).to.throw(TypeError, /You must provide at least one function/);

  });


  it('should throw a TypeError if one of the items is not a function', () => {

    const f1   = () => null;
    const f2   = () => null;
    const test = () => MW(f1, 'foo', f2);
    const message = 'All middleware given must be functions - index: 1'

    expect(test).to.throw(TypeError, message);

  });

  it('should throw an exception if a sub-item is not a function', () => {
    const f1 = () => null;
    const f2 = () => null;
    const f3 = () => null;
    const test = () => MW(f1, [f2, 'foo'], f3);
    const message = 'All middleware given must be functions - index: 1:1'

    expect(test).to.throw(TypeError, message);

  });

  it('should throw an exception if a sub-sub-item is not a function', () => {
    const f1 = () => null;
    const f2 = () => null;
    const f3 = () => null;
    const f4 = () => null;
    const f5 = () => null;
    const test = () => MW([f2, [f4, f5, 'foo']], f1, f3);
    const message = 'All middleware given must be functions - index: 0:1:2'

    expect(test).to.throw(TypeError, message);
  });


  it('should return a function with an arity of 3 when given one argument ' +
  'that is a function', () => {

    const actual = MW(() => null);
    expect(actual).to.be.a('function');
    expect(actual.length).to.eql(3);

  });

});
