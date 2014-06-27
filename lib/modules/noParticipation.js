addModule('noParticipation', function(module, moduleID) {
	var baseUrl =  [ window.location.protocol, '//', 'reddit.com' ].join('');
	var urls = {
		moreinfo: baseUrl + '/r/NoParticipation/wiki/intro',
		rules: baseUrl + '/wiki/rules',
	};

	module.moduleName = "No Participation";
	module.description = "Helps discouage brigading and helps you avoid getting banned, by warning against voting \
		or commenting when following \"No Participation\" (np) links, and by providing options to prevent you from 	\
		accidentally participating.	\
		<p><a href=\"" + urls.moreinfo + "\" target=\"_blank\">Find out more about \"No Participation\".</a></p>	\
						";

	module.category = "Comments";

	module.options = {
		disableVoteButtons: {
			type: 'boolean',
			value: false,
			description: "Hide vote buttons. If you have already visited the page and voted, your prior votes will still be visible."
		},
		disableCommentTextarea: {
			type: 'boolean',
			value: false,
			description: "Disable commenting."
		},
		evenIfSubscriber: {
			type: 'boolean',
			value: false,
			description: "Enable NP mode in subreddits where you're a subscriber"
		}
	};

	module.include = [
		/^https?:\/\/(?:.*\.)?(?:\w+-)?np(?:-\w+)?\.reddit\.com\/*/i  // np.reddit.com, np-nm.reddit.com, nm-np.reddit.com, www.np.reddit.com, www.np-nm.reddit.com
	];

	var boilerplateNotificationText = "	\
		<p><label class=\"RES-spoiler\">Hover here for more details</label> <span class=\"RES-spoiler-contents\">You came to this page by following a <a data-np=\"moreinfo\" target=\"_blank\">NP</a> link, and are likely not a member of this community. \
		Please respect reddit's <a data-np=\"rules\" target=\"_blank\">rules</a> by not commenting or voting. Doing so may get you banned.\
		<a data-np=\"moreinfo\" target=\"_blank\">Find out more</a></span></p>	\
		"


	var noParticipationActive;

	module.go = function() {
		if (this.isEnabled() && this.isMatchURL() && RESUtils.loggedInUser()) {

			if (isSubscriber()) {
				if (!module.options.evenIfSubscriber.value) {
					notifyNpIrrelevant();
					return;
				}
			}

			if ((RESUtils.pageType() === 'comments' || RESUtils.pageType() === 'linklist') && !(document.body.classList.contains('front-page') || document.body.classList.contains('profile-page'))) {
				applyNoParticipationMode();
			} else {
				notifyNpIrrelevant();
			}

			if (module.options.disableCommentTextarea.value) {
				RESUtils.addCSS('.usertext textarea[disabled] { background-color: #ccc; }');
			}
		}
	};

	module.isVotingBlocked = function() {
		return noParticipationActive && module.options['disableVoteButtons'].value;
	};
	module.notifyNoVote = notifyNoVote;

	function isSubscriber() {
	    return (document.body.classList.contains('subscriber'));
	}

	function setLinkUrls(urls, container) {
		$(container).find('[data-np]').each(function(index, element) {
			var key = element.getAttribute('data-np');
			var url = urls[key] || baseUrl;
			element.setAttribute('href', url);
		});
	}

	function notifyNpIrrelevant() {
		urls.leavenp = [ baseUrl, window.location.pathname, window.location.search, window.location.hash ].join('');
		var message = "You're still browsing in <a data-np=\"moreinfo\" target=\"_blank\">No Participation</a> mode, but it\'s no longer necessary.";
		if (isSubscriber()) {
		    message = "You're browsing in <a data-np=\"moreinfo\" target=\"_blank\">No Participation</a> mode, but it\'s not necessary because you're a subscriber here.";
		}

		var notification = modules['notifications'].showNotification({
			moduleID: moduleID,
			notificationID: 'ok-participation',
			closeDelay: 3000,
			header: 'Okay to Participate',
			message: message + " \
				<p><a data-np=\"leavenp\">Click here to return to normal reddit</a></p>"
		});

		setLinkUrls(urls, notification.element);
	}

	function notifyNpActive() {
		var notification = modules['notifications'].showNotification({
			moduleID: moduleID,
			notificationID: 'no-participation',
			closeDelay: 3000,
			header: 'No Participation',
			message: "<strong><span class=\"res-icon\">&#xF15A;</span> Do not vote or comment.</strong>" + boilerplateNotificationText
		});

		setLinkUrls(urls, notification.element);
	}

	function notifyNoVote(voteButton) {
		var canUndoVote = $(voteButton).is(".upmod,.downmod");

		var notification = modules['notifications'].showNotification({
			moduleID: moduleID,
			optionKey: 'disableVoteButtons',
			header: 'No Participation',
			message: "<strong><span class=\"res-icon\">&#xF15A;</span> Do not vote.</strong>" + boilerplateNotificationText
				+ (canUndoVote ? '<p><button class="redButton" data-np="revertvote">Undo vote</button></p>' : '')
		});

		setLinkUrls(urls, notification.element);
		$(notification.element).find('[data-np=revertvote]').on('click', function(e) {
			revertVote(voteButton, true);
			notification.close();
		});
	}

	function notifyNoComment() {
		var notification = modules['notifications'].showNotification({
			moduleID: moduleID,
			optionKey: 'disableCommentTextarea',
			header: 'No Participation',
			message: "<strong><span class=\"res-icon\">&#xF15A;</span> Do not comment.</strong>" + boilerplateNotificationText
		});

		setLinkUrls(urls, notification.element);
	}

	function applyNoParticipationMode() {
		noParticipationActive = true;

		notifyNpActive();

		if (module.options['disableVoteButtons'].value) {
			hideVoteButtons();
		}

		watchForVote();
		RESUtils.watchForElement('newComments', watchForVote);

		watchForComment();
		RESUtils.watchForElement('newCommentsForms', watchForComment);
	}

	function hideVoteButtons() {
		RESUtils.addCSS('.arrow.up:not(.upmod), .arrow.down:not(.downmod) { visibility: hidden; }');
	}

	function watchForVote(container) {
		container = container || document.body;

		var arrows = $(container).on('click', ".arrow", onClickVote);
	}

	function onClickVote(e) {
		onVote(e.target);
	}

	function onVote(voteButton) {
		if (!(voteButton.classList.contains('upmod') || voteButton.classList.contains('downmod'))) {
			return;
		}

		notifyNoVote(voteButton);
	}

	function revertVote(voteButton, immediately) {
		setTimeout(revertVote, (immediately ? 0 : 500));

		function revertVote() {
			if (voteButton.classList.contains('upmod') || voteButton.classList.contains('downmod')) {
				RESUtils.click(voteButton);

				var notification = modules['notifications'].showNotification({
					moduleID: moduleID,
					optionKey: 'disableVoteButtons',
					header: 'No Participation',
					message: "Your vote has been reverted. Please remember not to vote!	\
						<p><a data-np=\"moreinfo\" target=\"_blank\">Find out more</a></p>	\
						"
				});
				setLinkUrls(urls, notification.element);

			}
		}
	}


	var alreadyNotified = false;
	function watchForComment(container) {
		container = container || document.body;

		var textareas = modules['commentTools'].getCommentTextarea(container);

		textareas.one('keydown', function() {
			if (alreadyNotified) return;
			alreadyNotified = true;

			notifyNoComment();
		});

		if (module.options.disableCommentTextarea.value) {
			textareas.attr('disabled', true);
		}
	}
});
