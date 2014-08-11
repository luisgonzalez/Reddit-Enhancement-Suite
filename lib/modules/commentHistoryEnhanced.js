modules['commentHistoryEnhanced'] = {
	moduleID: 'commentHistoryEnhanced',
	moduleName: 'Comment History Enhanced',
	category: 'UI',
	options: {
		enableInbox: {
			type: 'boolean',
			value: true,
			description: 'Applies subreddit stylesheet to the inbox'
		},
		enableUserHistory: {
			type: 'boolean',
			value: true,
			description: 'Applies subreddit stylesheet to users\' history'
		},
		enableFriends: {
			type: 'boolean',
			value: true,
			description: 'Applies subreddit stylesheet to friends\' history'
		}
	},
	description: 'Display the comments in the user history and inbox as if seen inside the subreddit they were posted on',
	isEnabled: function() {
		return RESConsole.getModulePrefs(this.moduleID);
	},
	isMatchURL: function() {
		return RESUtils.isMatchURL(this.moduleID);
	},
	include: Array(
		/https?:\/\/([a-z]+).reddit.com\/user\/.*/i,
		/https?:\/\/([a-z]+).reddit.com\/message\/.*/i,
		/https?:\/\/([a-z]+).reddit.com\/r\/friends\/.*/i
	),
	go: function() {
		if ((this.isEnabled()) && (this.isMatchURL())) {
			this.applySubredditStyleToHistory();
		}
	},
	__loadedSubredditStylesheets: {},
	getSubredditStylesheet: function(subreddit, callback) {
		BrowserStrategy.ajax({
					method:	'GET',
					url:	location.protocol + '//'+ location.hostname+ '/r/' + subreddit + '/stylesheet.css',
					onload:	function(response) {
						modules['commentHistoryEnhanced'].__loadedSubredditStylesheets[subreddit] = response.responseText.replace(/([^\}]*?(\{|,))/mg, '.res_st_sr_' + subreddit + ' $1');
						if (typeof(callback) == 'function') {
							callback(modules['commentHistoryEnhanced'].__loadedSubredditStylesheets[subreddit]);
						}
					}
				});
	},
	__injectedSubredditStylesheets: {},
	injectSubredditStylesheet: function(subreddit) {
		if (!this.__injectedSubredditStylesheets[subreddit]) {
			this.__injectedSubredditStylesheets[subreddit] = '.res_st_sr_' + subreddit + '{}'; // This thing works pretty fast... let's give it some bogus stuff and hope for the best
			if (!this.__loadedSubredditStylesheets[subreddit]) {
				this.getSubredditStylesheet(subreddit, RESUtils.addStyle);
			} else {
				RESUtils.addStyle(this.__loadedSubredditStylesheets[subreddit]);
			}
		}
	},
	applySubredditStyleToHistory: function(html) {
		this.applySubredditStyleToUserOverview(html);
		this.applySubredditStyleToInbox(html);
		this.applySubredditStyleToFriends(html);
	},
	applySubredditStyleToThings: function(html) {
		things = html.querySelectorAll('.comment, .link');
		for (var ix = 0; ix < things.length; ix++) {
			subredditElement = things[ix].querySelector('.subreddit');
			if (subredditElement) {
				subredditName = subredditElement.innerHTML.replace('/r/', '').replace('/', '');
				$(things[ix]).addClass('res_st_sr_' + subredditName);
				this.injectSubredditStylesheet(subredditName);
			}
		}
	},
	applySubredditStyleToUserOverview: function(html) {
		if (this.isEnabled() == false || this.options.enableUserHistory.value == false || RESUtils.pageType() != 'profile') return;
		if (typeof(html) == 'undefined') html = document.querySelector('#siteTable');
		this.applySubredditStyleToThings(html);
	},
	applySubredditStyleToFriends: function(html) {
		// this one doesn't exist and I'm very respectful of what's not mine to touch... so no RESUtils.pageType here
		friendsRegex = /https?:\/\/([a-z]+).reddit.com\/r\/friends\/.*/i;
		var currURL = location.href.split('#')[0];
		if (this.isEnabled() == false || this.options.enableFriends.value == false || friendsRegex.test(currURL) == false) return;
		if (typeof(html) == 'undefined') html = document.querySelector('#siteTable');
		this.applySubredditStyleToThings(html);
	},
	applySubredditStyleToInbox: function(html) {
		if (this.isEnabled() == false || this.options.enableInbox.value == false || RESUtils.pageType() != 'inbox') return;
		if (typeof(html) == 'undefined') html = document.querySelector('#siteTable');
		messages = html.querySelectorAll('.message');
		for (var ix = 0; ix < messages.length; ix++) {
			subredditElement = messages[ix].querySelector('p.tagline span.head a[href^="/r/"]');
			if (subredditElement) {
				subredditName = subredditElement.innerHTML.replace('/r/', '').replace('/', '');
				$(messages[ix]).addClass('res_st_sr_' + subredditName);
				this.injectSubredditStylesheet(subredditName);
			}
		}
	}
};