const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

function loadAppScript() {
  const htmlPath = path.join(__dirname, '..', 'app', 'src', 'main', 'assets', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('No <script> tag found in index.html');
  return match[1];
}

function createContext() {
  const elements = new Map();
  function getEl(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        textContent: '',
        innerHTML: '',
        value: '',
        classList: { add() {}, remove() {} },
        dataset: {},
        addEventListener() {},
        getContext() { return {}; }
      });
    }
    return elements.get(id);
  }

  const mockDOM = {
    getElementById: (id) => getEl(id),
    querySelectorAll: () => [],
    addEventListener: () => {}
  };

  const sandbox = {
    window: { SHANGHAI_POLICY_URL: '' },
    document: mockDOM,
    localStorage: {
      _store: {},
      getItem(k) { return this._store[k] || null; },
      setItem(k, v) { this._store[k] = String(v); }
    },
    fetch: () => Promise.resolve({ ok: false }),
    console: { log() {}, warn() {}, error() {} },
    Chart: class { destroy() {} update() {} }
  };

  const ctx = vm.createContext(sandbox);
  const scriptContent = loadAppScript();
  vm.runInContext(scriptContent, ctx);
  return ctx;
}

function runSuite() {
  const results = [];
  function it(name, fn) {
    try {
      fn();
      results.push({ name, pass: true });
    } catch (err) {
      results.push({ name, pass: false, error: err.message });
    }
  }

  // Test 1: Script loads without syntax or runtime error
  it('App script loads and initializes state', () => {
    const ctx = createContext();
    const state = vm.runInContext('state', ctx);
    assert.strictEqual(typeof state, 'object');
    assert.strictEqual(state.scheme, 'enterprise');
  });

  // Test 2: Enterprise statutory retirement age
  it('Statutory retirement delay calculation matches 2025 reform', () => {
    const ctx = createContext();
    const retMale1965 = vm.runInContext('calcStatutoryRetire(1965, 1, "male")', ctx);
    assert.strictEqual(retMale1965.delayMonths, 1);
    assert.strictEqual(retMale1965.statutoryYear, 2025);
    assert.strictEqual(retMale1965.statutoryMonth, 2);

    const retFemale50_1975 = vm.runInContext('calcStatutoryRetire(1975, 1, "female50")', ctx);
    assert.strictEqual(retFemale50_1975.delayMonths, 1);
    assert.strictEqual(retFemale50_1975.statutoryYear, 2025);
    assert.strictEqual(retFemale50_1975.statutoryMonth, 2);
  });

  // Test 3: Enterprise pension calculation returns positive values
  it('Enterprise pension calculation produces consistent output', () => {
    const ctx = createContext();
    const res = vm.runInContext('calculatePension()', ctx);
    assert(res.total > 0, 'Total pension must be > 0');
    assert(res.basic > 0, 'Basic pension must be > 0');
    assert(res.personal > 0, 'Personal account pension must be > 0');
  });

  // Test 4: Policy config update updates active policy wage and calculation
  it('Policy hot-update correctly impacts pensionBase and calculation', () => {
    const ctx = createContext();
    const resBefore = vm.runInContext('calculatePension()', ctx);
    const baseWageBefore = vm.runInContext('ACTIVE_BASE_WAGE', ctx);

    vm.runInContext('applyPolicyConfig({ pensionBase: 15000 })', ctx);
    const baseWageAfter = vm.runInContext('ACTIVE_BASE_WAGE', ctx);
    assert.strictEqual(baseWageAfter, 15000, 'ACTIVE_BASE_WAGE must update to 15000');

    const resAfter = vm.runInContext('calculatePension()', ctx);
    assert.notStrictEqual(resBefore.basic, resAfter.basic, 'Basic pension must change when pensionBase changes');
    assert.strictEqual(resAfter.futureBase > resBefore.futureBase, true, 'futureBase must scale with pensionBase');
  });

  // Test 5: Policy config update updates resident basic pension and calculation
  it('Policy hot-update correctly impacts residentBasic calculation', () => {
    const ctx = createContext();
    vm.runInContext('state.scheme = "resident"', ctx);
    const resBefore = vm.runInContext('calculatePension()', ctx);

    vm.runInContext('applyPolicyConfig({ residentBasic: 1800 })', ctx);
    const resAfter = vm.runInContext('calculatePension()', ctx);
    assert.strictEqual(resAfter.futureBase, 1800, 'Resident futureBase must update to 1800');
    assert(resAfter.basic >= 1800, 'Resident basic pension must be at least 1800');
  });

  // Test 6: Government scheme deemed years must never exceed total actual years
  it('Government deemedYears must not exceed actualYears when gaps exist', () => {
    const ctx = createContext();
    vm.runInContext('state.scheme = "government"', ctx);
    vm.runInContext('state.birthYear = 1970', ctx);
    vm.runInContext('state.startWorkYear = 1990', ctx);
    vm.runInContext('state.gapYears = 20', ctx);
    const res = vm.runInContext('calculatePension()', ctx);
    assert(res.actualYears > 0, 'actualYears must be > 0');
    assert(res.deemedYears <= res.actualYears, `deemedYears (${res.deemedYears}) must not exceed actualYears (${res.actualYears})`);
  });

  // Summary
  let failed = 0;
  console.log('=== Test Suite Results ===');
  for (const r of results) {
    if (r.pass) {
      console.log(`[PASS] ${r.name}`);
    } else {
      failed++;
      console.error(`[FAIL] ${r.name}: ${r.error}`);
    }
  }
  console.log(`Total: ${results.length}, Passed: ${results.length - failed}, Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}

runSuite();
