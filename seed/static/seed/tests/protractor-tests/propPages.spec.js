// check inventory pages after import and delete test dataset
var EC = protractor.ExpectedConditions;
// Check inventory Page:
describe('When I go to the inventory page', function () {
	it('should change to our test cycle', function () {
		browser.ignoreSynchronization = false;
		browser.get("/app/#/properties");
		$('[ng-change="update_cycle(cycle.selected_cycle)"]').element(by.cssContainingText('option', browser.params.testOrg.cycle)).click();

		var rows = $('.left.ui-grid-render-container-left.ui-grid-render-container')
					.all(by.repeater('(rowRenderIndex, row) in rowContainer.renderedRows'));

		rows.count().then(function (count) {
			$('.item-count.ng-binding').getText().then(function (label) {
				expect(label).toContain(count);
			})
		})
	});

	it('should filter semi colon and expand', function () {
		var jurisTL = $$('[role="columnheader"]').filter(function(elm) {
			return elm.getText().then(function (label) {
				return label.includes('Jurisdiction Tax Lot ID');
			});
		}).first();
		jurisTL.$$('[ng-model="colFilter.term"]').first().sendKeys(';');
	});

	it('should filter', function () {
		var rows = $('.left.ui-grid-render-container-left.ui-grid-render-container')
					.all(by.repeater('(rowRenderIndex, row) in rowContainer.renderedRows'));

		rows.first().getText().then(function (label) {
			$$('[ng-model="colFilter.term"]').first().sendKeys(label);
		});
		//after filter
		expect(rows.count()).not.toBeLessThan(1);

		//clear by clicking the 'x' -> child of sibling of text input
		$$('[ng-model="colFilter.term"]').first().element(by.xpath('..')).$('[ui-grid-one-bind-aria-label="aria.removeFilter"]').click();
		expect($$('[ng-model="colFilter.term"]').first().getAttribute('value')).toEqual('');
		$$('[ng-model="colFilter.term"]').first().sendKeys('this is something long and fake to get nothing to filter');
		expect(rows.count()).toBeLessThan(1);
		$('.ui-grid-icon-menu').click();
		var myOptions = element.all(by.repeater('item in menuItems')).filter(function (elm) {
			return elm.getText().then(function(label) { 
				return label == ' Clear all filters';
			});
		}).first();
		myOptions.click();		
	});

	it('should go to info pages', function () {
		$$('[ng-click="treeButtonClick(row, $event)"]').first().click();
		$$('.ui-grid-icon-info-circled').first().click();
		expect(browser.getCurrentUrl()).toContain("/app/#/properties");
		expect($('.page_title').getText()).toEqual('Property Detail');

		// no historical items
		var historicalItems = element.all(by.repeater('historical_item in historical_items'));
		
		// commented out, not guarranteed:
		// expect(historicalItems.count()).toBeLessThan(1);
		
		//make change
		$('[ng-click="on_edit()"]').click();
		var firstInput = $$('#edit_attribute_id').first();
		firstInput.sendKeys('protractor unique stuff');
		$('[ng-click="on_save()"]').click();

		// now historical items
		var historicalItems = element.all(by.repeater('historical_item in historical_items'));
		expect(historicalItems.count()).not.toBeLessThan(1);

		var labels = element.all(by.repeater('label in labels'));
		expect(labels.count()).toBeLessThan(1);

		// add label
		$('[ng-click="open_update_labels_modal(inventory.id, inventory_type)"]').click();
		$('.modal-title').getText().then(function (label) {
			expect(label).toContain('Labels');
		});
		$$('[ng-model="label.is_checked_add"]').first().click();
		$('[ng-click="done()"]').click();

		var labels = element.all(by.repeater('label in labels'));
		expect(labels.count()).not.toBeLessThan(1);
		
	});

	it('should go to settings in info pages', function () {
		$('#settings').click();
		$('[ng-if="grid.options.enableSelectAll"]').click().click();
		$$('[ng-class="{\'ui-grid-row-selected\': row.isSelected}"]').first().click();
		$('#item_title').click();
		var rows = element.all(by.repeater('field in columns'));
		expect(rows.count()).toBe(1);
		$('a.page_action.ng-binding').click();
	});


	it('should get taxlot info from linked properties', function () {
		// re expand
		$$('[ng-click="treeButtonClick(row, $event)"]').first().click();
		
		$$('.ui-grid-icon-info-circled').get(2).click();
		expect(browser.getCurrentUrl()).toContain("/app/#/taxlots");
		expect($('.page_title').getText()).toEqual('Tax Lot Detail');
		$('a.page_action.ng-binding').click();
		expect(browser.getCurrentUrl()).toContain("/app/#/taxlots");
	});

	it('should filter labels and see info update', function () {
		browser.get("/app/#/properties");
		$('[ng-change="update_cycle(cycle.selected_cycle)"]').element(by.cssContainingText('option', browser.params.testOrg.cycle)).click();
		$('#tagsInput').click();
		$('#tagsInput').all(by.repeater('item in suggestionList.items')).first().click();
		var rows = $('.left.ui-grid-render-container-left.ui-grid-render-container')
				.all(by.repeater('(rowRenderIndex, row) in rowContainer.renderedRows'));
		expect(rows.count()).toBe(1);
		rows.filter(function(elm) {
			return elm.getText().then(function (label) {
				expect(label).toContain('protractor unique stuff');
				return;
			})
		});
		$('[ng-click="clear_labels()"]').click();
		var rows = $('.left.ui-grid-render-container-left.ui-grid-render-container')
				.all(by.repeater('(rowRenderIndex, row) in rowContainer.renderedRows'));
		expect(rows.count()).not.toBeLessThan(2);
	});

	it('should change columns', function () {
		$('#list-settings').click();
		$('[ng-if="grid.options.enableSelectAll"]').click().click();
		$$('[ng-class="{\'ui-grid-row-selected\': row.isSelected}"]').first().click();
		$('#inventory-list').click();
		var cols = $('.ui-grid-render-container.ui-grid-render-container-body').all(by.repeater('col in colContainer.renderedColumns'));
		expect(cols.count()).toBe(1);
	});


	it('should export', function () {
		$('.ui-grid-icon-menu').click();
		var myOptions = element.all(by.repeater('item in menuItems')).filter(function (elm) {
			return elm.getText().then(function(label) { 
				return label == '  Export all data as csv';
			});
		}).first();
		myOptions.click();		
	});

		// Reports page from Inventory
	it('should see inventory page and select reports page', function () {
		$('#sidebar-inventory').click();
		expect($('.ui-grid-contents-wrapper').isPresent()).toBe(true);
		expect($('.page_title').getText()).toContain('Properties');
		$('.form-control.input-sm').element(by.cssContainingText('option', browser.params.testOrg.cycle)).click();
		expect($('.item-count').getText()).toContain('18 Properties');
		$$('[ng-model="colFilter.term"]').first().click().sendKeys('2342').then();
		expect($('[ng-model="cycle.selected_cycle"]').getText()).toContain(browser.params.testOrg.cycle);
		expect($('.item-count').getText()).toContain('1 Property');
		$$('[ng-model="colFilter.term"]').first().clear();
		expect($('.item-count').getText()).toContain('18 Properties');
		$$('[href="#/taxlots"]').click();
		expect($('.page_title').getText()).toContain('Tax Lots');
		expect($('.item-count').getText()).toContain('11 Tax Lots');

		$('#reports').click();
		expect($('.page_title').getText()).toContain('Inventory Reports');
		expect($('svg').isPresent()).toBe(true);

		$('.btn.btn-primary').click();
		browser.wait(EC.presenceOf($('#dimple-use-description-2017--0-99k-2017--')), 10000);
		browser.wait(EC.presenceOf($('#dimple-use-description-2017--500-599k-2017--')), 10000);
		browser.wait(EC.presenceOf($('.dimple-series-0')), 10000);
		expect($('.fa.fa-square').isPresent()).toBe(true);
		expect($('.fa.fa-circle').isPresent()).toBe(true);
	});
});
