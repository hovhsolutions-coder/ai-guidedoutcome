require('../helpers/register-ts-runtime.cjs');

const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { presentGuidanceSessionForProgressStateOverride } = require('../../src/components/guidance/guidance-session-presenter.ts');

function buildControllerFixture(fixture, presentation) {
  return {
    input: {
      rawInput: fixture.state.input.rawInput,
      setRawInput: () => {},
      situation: fixture.state.input.situation,
      setSituation: () => {},
      mainGoal: fixture.state.input.mainGoal,
      setMainGoal: () => {},
      selectedMode: fixture.state.input.selectedMode,
      setSelectedMode: () => {},
      intakeAnswers: fixture.state.input.intakeAnswers,
      setIntakeAnswers: () => {},
    },
    feedback: {
      error: fixture.state.feedback.error,
      generationStatus: fixture.state.feedback.generationStatus,
      isLoading: fixture.state.feedback.isLoading,
      isSubmittingFollowUp: fixture.state.feedback.isSubmittingFollowUp,
    },
    presentation,
    actions: {
      submitGuidance: async () => {},
      submitFollowUp: async () => {},
      selectTrainer: async () => {},
      handleSuccessfulDossierConversion: () => {},
    },
  };
}

function renderGuidanceShellWithController(controller, options = {}) {
  const controllerModulePath = require.resolve('../../src/components/guidance/use-guidance-session-controller.ts');
  const previousControllerModule = require.cache[controllerModulePath];
  const restoreModuleOverrides = applyModuleOverrides(options.moduleOverrides ?? {});

  require.cache[controllerModulePath] = {
    id: controllerModulePath,
    filename: controllerModulePath,
    loaded: true,
    exports: {
      useGuidanceSessionController: () => controller,
    },
  };

  const shellModulePath = require.resolve('../../src/components/guidance/guidance-session-shell.tsx');
  delete require.cache[shellModulePath];

  try {
    const shellModule = require(shellModulePath);
    return renderToStaticMarkup(React.createElement(shellModule.GuidanceSessionShell));
  } finally {
    delete require.cache[shellModulePath];
    restoreModuleOverrides();
    if (previousControllerModule) {
      require.cache[controllerModulePath] = previousControllerModule;
    } else {
      delete require.cache[controllerModulePath];
    }
  }
}

function withMockedGuidanceShell(run) {
  const nextNavigationPath = require.resolve('next/navigation');
  const previousNavigationModule = require.cache[nextNavigationPath];

  require.cache[nextNavigationPath] = {
    id: nextNavigationPath,
    filename: nextNavigationPath,
    loaded: true,
    exports: {
      useRouter: () => ({
        push() {},
      }),
    },
  };

  try {
    clearGuidanceShellModuleCache();
    const shellModulePath = require.resolve('../../src/components/guidance/guidance-session-shell.tsx');
    const shellModule = require(shellModulePath);
    run(shellModule.GuidanceSessionShell);
  } finally {
    clearGuidanceShellModuleCache();
    if (previousNavigationModule) {
      require.cache[nextNavigationPath] = previousNavigationModule;
    } else {
      delete require.cache[nextNavigationPath];
    }
  }
}

function clearGuidanceShellModuleCache(extraPaths = []) {
  const paths = [
    '../../src/components/guidance/guidance-session-shell.tsx',
    '../../src/components/guidance/guidance-session-presenter.ts',
    '../../src/components/guidance/guidance-zone-profiles-presenter.ts',
    '../../src/components/guidance/guidance-section-visibility-presenter.ts',
    '../../src/lib/guidance-session/build-guidance-right-rail-view-model.ts',
    '../../src/components/guidance/guidance-trainer-section.tsx',
    '../../src/components/guidance/guidance-next-path-panel.tsx',
    '../../src/components/guidance/guidance-trainer-response-block.tsx',
    '../../src/components/guidance/guidance-structured-contracts-panel.tsx',
    '../../src/components/guidance/guidance-execution-ready-section.tsx',
    '../../src/components/guidance/guidance-execution-transition.tsx',
    '../../src/lib/guidance-session/envelope-first-presenter-helpers.ts',
    ...extraPaths,
  ];

  for (const path of new Set(paths)) {
    delete require.cache[require.resolve(path)];
  }
}

function applyModuleOverrides(moduleOverrides) {
  const previousModules = [];
  const overridePaths = Object.keys(moduleOverrides);

  clearGuidanceShellModuleCache(overridePaths);

  for (const path of overridePaths) {
    const resolvedPath = require.resolve(path);
    previousModules.push([resolvedPath, require.cache[resolvedPath]]);
    require.cache[resolvedPath] = {
      id: resolvedPath,
      filename: resolvedPath,
      loaded: true,
      exports: moduleOverrides[path],
    };
  }

  return () => {
    clearGuidanceShellModuleCache(overridePaths);
    for (const [resolvedPath, previousModule] of previousModules) {
      if (previousModule) {
        require.cache[resolvedPath] = previousModule;
      } else {
        delete require.cache[resolvedPath];
      }
    }
  };
}

function countMatches(value, pattern) {
  return value.match(pattern)?.length ?? 0;
}

function buildDossierConversionPresentation(basePresentation) {
  return presentGuidanceSessionForProgressStateOverride({
    baseState: {
      intake: basePresentation.intake,
      rightRailView: basePresentation.rightRailView,
    },
    progressState: 'dossier_conversion_loading',
  });
}

module.exports = {
  buildDossierConversionPresentation,
  buildControllerFixture,
  countMatches,
  renderGuidanceShellWithController,
  withMockedGuidanceShell,
};
