addModule('presets', function(module, moduleID) {
	module.moduleName = 'Presets';
	module.category = 'About RES';
	module.description = 'Select from various preset RES configurations';

	module.options.cleanSlate = {
		description: 'Turn off all the RES modules',
		type: 'button',
		text: 'apply preset',
		callback: function() {
			modules['notifications'].showNotification({
				moduleID: moduleID,
				optionKey: 'cleanSlate',
				text: 'apply preset',
				message: 'Turned off all RES modules! Reload to see the result.'
			});
			toggleModules(undefined, '*');
		}
	};

	module.options.noPopups = {
		description: 'Turn off notifications and hover pop-ups',
		type: 'button',
		text: 'apply preset',
		callback: function() {
			modules['notifications'].showNotification({
				moduleID: moduleID,
				optionKey: 'noPopups',
				message: 'Turned off pop-ups! Reload to see the result.'
			});
			toggleModules(undefined, 'hover RESTips showParent subredditInfo '.split(/[,\s]/));
			toggleOptions(undefined, 'userTagger.hoverInfo'.split(/[,\s]/));

		}
	};


	function sanitizeModulesList(unsanitized) {
		var sanitized;
		if (unsanitized === '*') {
			sanitized = allModules();
		} else if (typeof unsanitized === 'string') {
			sanitized = unsanitized.split(/[,\s]/);
		}
		sanitized = sanitized ? [].concat(sanitized) :
			[];

		return sanitized;
	}

	function toggleModules(requestEnable, requestDisable) {
		var enable, disable;
		enable = sanitizeModulesList(requestEnable);
		disable = sanitizeModulesList(requestDisable);

		disable = requestEnable !== '*' ?
			disable.filter(function(moduleID) {
				return enable.indexOf(moduleID) === -1;
			}) :
			disable;

		enable = requestDisable !== '*' ?
			enable.filter(function(moduleID) {
				return disable.indexOf(moduleID) === -1;
			}) :
			enable;

		disable.forEach(function(moduleID) {
			RESUtils.options.enableModule(moduleID, false);
		});
		enable.forEach(function(moduleID) {
			RESUtils.options.enableModule(moduleID, true);
		});
	}

	function allModules() {
		return Object.getOwnPropertyNames(modules);
	}

	function toggleOptions(requestEnable, requestDisable) {
		var enable, disable;
		enable = requestEnable ? [].concat(requestEnable) : [];
	 	disable = requestDisable ? [].concat(requestDisable) : [];

	 	enable.forEach(setOptionValue.bind(this, true));
	 	disable.forEach(setOptionValue.bind(this, false));
	 }
 	function setOptionValue(value, path) {
 		// path = [moduleID, optionName] or 'moduleID.optionName'
 		if (typeof path === 'string') {
 			path = path.split('.');
 		}
 		RESUtils.options.setOption.apply(RESUtils.options, [].concat(path).concat(value));
 	}
});
