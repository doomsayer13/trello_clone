TrelloClone.Views.BoardShow = Backbone.View.extend({
	initialize: function() {
		this.childrenViews = [];
		var model = this.model;
		var lists = model.get('lists');

		this.listenTo(lists, "add", this.render);
		this.listenTo(lists, "destroy", this.render);
		this.listenTo(this.model, "change", this.render);		
	},
	
	events: {
		"submit #createList": "createList",
		"click #editBoard": "editBoard"
	},
	
  template: JST['boards/show'],
			
	createList: function(event) {
		event.preventDefault();
		
		var data = $(event.currentTarget).serializeJSON();
		var title = data.list.title;
		var board_id = this.model.id
		
		this.model.get('lists').create(
			{title: title, board_id: board_id},
			{wait: true});
		
		$('#newList').modal('hide');
		$('.modal-backdrop').remove();
		$('body').removeClass('modal-open');									
	},
	
	editBoard: function(event) {
		var board = this.model
		
		var editForm = new TrelloClone.Views.BoardForm({model: board});
		this.childrenViews.push(editForm);

		$(event.currentTarget.parentElement).html(editForm.render().$el);
	},
	
		
	render: function() {
		var that = this;
		
		var renderedContent = that.template({
			board: that.model
		});
		
		that.$el.html(renderedContent);
		
		that._renderLists();
		that._renderSidebar();		
		that._triggerSortable();
		
		return that;		
	},
	
	_renderLists: function() {
		var that = this;
		
		that.model.get('lists').each(function(list) {
			var listView = new TrelloClone.Views.ListsShow({model: list});
			that.childrenViews.push(listView);
			
			that.$('#lists').append(listView.render().$el);
		});
	},
	
	_renderSidebar: function() {
		var that = this;
		
		var membersView = new TrelloClone.Views.MembersIndex({
			collection: that.model.get('members'),
			id: "board-" + that.model.get('id')
		});
		
		that.$('#sidebar').html(membersView.render().$el);	
	},
	
	_generatePositions: function(listIds) {
		var newPositions = {};
		
		_.each(listIds, function(listId, i) {
			newPositions[listId] = i;
		});
		
		return {positions: newPositions}
	},
	
	_triggerSortable: function() {
		var that = this;
		var hook = that.$el;
		var $lists = hook.find('#lists');

		var userId = that.model.get('user_id');
		var boardId = that.model.get('id');
		var url = "/users/" + userId + "/boards/" + boardId + "/positions";
		
		$lists.sortable({
			tolerance: "pointer",
			update: function(event, ui) {
				var listIds = $(this).sortable("toArray");
				var newPositions = that._generatePositions(listIds);
				
				$.ajax({
					url: url,
					data: newPositions,
					dataType: "json",
					type: "put",
					success: function(responseData) {
						that.model.get("lists").set(responseData, 
							{silent: true, parse: true});
					}							
				});
			}
		});
	},
	
	leave: function() {
		_.each(this.childrenViews, function(childView) {
			childView.leave();
		});
		
		this.off();
		this.remove();
	}
});
