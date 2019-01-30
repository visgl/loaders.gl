// TODO - move to @luma.gl/test-utils
/* global window */
import {AnimationLoop, withParameters} from 'luma.gl';
import GL from 'luma.gl/constants';

function getBoundingBoxInPage(canvas) {
  const bbox = canvas.getBoundingClientRect();
  return {
    x: window.scrollX + bbox.x,
    y: window.scrollY + bbox.y,
    width: bbox.width,
    height: bbox.height
  };
}

const DEFAULT_TEST_CASE = {
  onStart: () => {},
  onAfterRender: ({done}) => done()
};

const RENDER_PARAMETERS = {
  blend: true,
  blendFunc: [GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA, GL.ONE, GL.ONE_MINUS_SRC_ALPHA],
  depthTest: true,
  depthFunc: GL.LEQUAL
};

export default class TestRender {
  /**
   * props
   *   AnimationLoop props
   *   onTestStart (Function) - callback when a test case is started
   *   onTestResult (Function) - callback when a test case is done
   */
  constructor(props = {}) {
    this.props = props;
    this.isRunning = false;
    this._testCases = [];
    this._testCaseData = null;
  }

  /**
   * testCase
   *   name (String)
   *   onStart (Function)
   *   onRender (Function)
   *   onAfterRender (Function)
   *   goldenImage (String)
   *   threshold (Number)
   */
  add(testCases) {
    if (!Array.isArray(testCases)) {
      testCases = [testCases];
    }
    for (const testCase of testCases) {
      this._testCases.push(Object.assign({}, DEFAULT_TEST_CASE, testCase));
    }
    return this;
  }

  // Returns a promise that resolves when all the test cases are done
  run() {
    return new Promise((resolve) => {
      this._animationLoop = new AnimationLoop(Object.assign({}, this.props, {
        onRender: this.onRender.bind(this),
        onFinalize: () => {
          this.isRunning = false;
          resolve();
        }
      }));
      this._animationLoop.start(this.props);

      this.isRunning = true;
      this.isDiffing = false;
      this.currentTestCase = null;
    });
  }

  onRender(animationProps) {
    if (this.isDiffing) {
      // wait for the current diffing to finish
      return;
    }

    let testCase = this.currentTestCase;
    let isDone = false;

    if (!testCase) {
      // get the next test case
      testCase = this._testCases.shift();
      if (testCase) {
        withParameters(animationProps.gl, RENDER_PARAMETERS, () => {
          this._testCaseData = testCase.onStart(animationProps) || {};
        });
        this.props.onTestStart(testCase);
        this.currentTestCase = testCase;
      } else {
        // all test cases are done
        this._animationLoop.stop();
        return;
      }
    }

    const testCaseAnimationProps = Object.assign({}, animationProps, this._testCaseData, {
      // called when the test case is done rendering and ready for capture and diff
      done: () => {
        isDone = true;
      }
    });
    withParameters(animationProps.gl, RENDER_PARAMETERS, () => {
      testCase.onRender(testCaseAnimationProps);
      testCase.onAfterRender(testCaseAnimationProps);
    });

    if (isDone) {
      // finalize all resources
      for (const key in this._testCaseData) {
        const value = this._testCaseData[key];
        if (value && value.delete) {
          value.delete();
        }
      }
      this.isDiffing = true;
      window.browserTestDriver_captureAndDiffScreen(Object.assign({}, testCase, {
        region: getBoundingBoxInPage(animationProps.canvas)
      })).then(result => {
        this.props.onTestResult(testCase, result);
        this.currentTestCase = null;
        this.isDiffing = false;
      });
    }
  }
}
