/**
 * 整个模块就是做一件事:
 *      把注册的 plugin 中的值都读出来, 放入 module 中的全局对象 map 中
 *      这些值是: {
 *          dependencies,
 *          pluginModule
 *          dispatchConfig
 *      }
 *
 */

/**
 *
 *  下面的值是 key-value 形式, 是把 plugin 中的值都拍平后
 *
 */
export const namesToPlugins = {};
export const plugins = [];
export const eventNameDispatchConfigs = {};
export const registrationNameModules = {};
export const registrationNameDependencies = {};

function publishRegistrationName(registrationName, pluginModule, eventName) {
  registrationNameModules[registrationName] = pluginModule;
  registrationNameDependencies[registrationName] =
    pluginModule.eventTypes[eventName].dependencies;
}

function publishEventForPlugin(dispatchConfig, pluginModule, eventName) {
  eventNameDispatchConfigs[eventName] = dispatchConfig;
  const phasedRegistrationNames = dispatchConfig.phasedRegistrationNames;
  if (phasedRegistrationNames) {
    for (const phraseName in phasedRegistrationNames) {
      const phrasedRegistrationName = phasedRegistrationNames[phraseName];
      publishRegistrationName(phrasedRegistrationName, pluginModule, eventName);
    }
  } else if (dispatchConfig.registrationName) {
    publishRegistrationName(
      dispatchConfig.registrationName,
      pluginModule,
      eventName
    );
  }
}

function recomputePluginOrdering() {
  for (const pluginName in namesToPlugins) {
    Object.entries(namesToPlugins).forEach(
      ([pluginName, pluginModule], index) => {
        const publishedEvents = pluginModule.eventTypes;
        plugins[index] = pluginModule;
        for (const eventName in publishedEvents) {
          publishEventForPlugin(
            publishedEvents[eventName],
            pluginModule,
            eventName
          );
        }
      }
    );
  }
}

function injectEventPluginsByName(injectedNamesToPlugins) {
  for (const pluginName in injectedNamesToPlugins) {
    if (!injectedNamesToPlugins.hasOwnProperty(pluginName)) {
      continue;
    }
    const pluginModule = injectedNamesToPlugins[pluginName];
    if (
      !namesToPlugins[pluginName] ||
      namesToPlugins[pluginName] !== pluginModule
    ) {
      namesToPlugins[pluginName] = pluginModule;
    }
  }
  recomputePluginOrdering();
}

const injection = {
  injectEventPluginsByName
};

export { injection };
