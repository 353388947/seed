/*
 * :copyright (c) 2014 - 2016, The Regents of the University of California, through Lawrence Berkeley National Laboratory (subject to receipt of any required approvals from the U.S. Department of Energy) and contributors. All rights reserved.
 * :author
 */
angular.module('BE.seed.controller.data_quality_admin', [])
.controller('data_quality_admin_controller', [
  '$scope',
  '$q',
  '$state',
  '$stateParams',
  'columns',
  'organization_payload',
  'data_quality_rules_payload',
  'auth_payload',
  'labels_payload',
  'data_quality_service',
  'organization_service',
  'label_service',
  'spinner_utility',
  '$uibModal',
  'urls',
  function (
    $scope,
    $q,
    $state,
    $stateParams,
    columns,
    organization_payload,
    data_quality_rules_payload,
    auth_payload,
    labels_payload,
    data_quality_service,
    organization_service,
    label_service,
    spinner_utility,
    $uibModal,
    urls
  ) {
    $scope.inventory_type = $stateParams.inventory_type;
    $scope.org = organization_payload.organization;
    $scope.auth = auth_payload.auth;

    $scope.state = $state.current;

    $scope.data_types = [{
      id: null,
      label: ''
    }, {
      id: 'number',
      label: 'Number'
    }, {
      id: 'string',
      label: 'Text'
    }, {
      id: 'date',
      label: 'Date'
    }, {
      id: 'year',
      label: 'Year'
    }];
    $scope.units = ['', 'square feet', 'kBtu/sq. ft./year'];

    $scope.columns = columns;
    $scope.all_labels = labels_payload;

    var loadRules = function (rules_payload) {
      $scope.ruleGroups = {
        properties: {},
        taxlots: {}
      };
      _.forEach(rules_payload.rules, function (inventory_type, index) {
        _.forEach(inventory_type, function (rule) {
          if (!_.has($scope.ruleGroups[index], rule.field)) $scope.ruleGroups[index][rule.field] = [];
          var row = rule;
          if (row.data_type === 'date') {
            if (row.min) row.min = moment(row.min, 'YYYYMMDD').toDate();
            if (row.max) row.max = moment(row.max, 'YYYYMMDD').toDate();
          }
          if (rule.label) {
            var match = _.find(labels_payload, function (label) {
              return label.id === rule.label;
            });
            if (match) {
              row.label = match;
            }
          }
          $scope.ruleGroups[index][rule.field].push(row);
        });
      });
    };
    loadRules(data_quality_rules_payload);

    // Restores the default rules
    $scope.restore_defaults = function () {
      spinner_utility.show();
      $scope.defaults_restored = false;
      data_quality_service.reset_default_data_quality_rules($scope.org.org_id).then(function (rules) {
        loadRules(rules);
        $scope.defaults_restored = true;
      }, function (data) {
        $scope.$emit('app_error', data);
      }).finally(function () {
        spinner_utility.hide();
      });
    };

    // Reset all rules
    $scope.reset_all_rules = function () {
      spinner_utility.show();
      $scope.rules_reset = false;
      data_quality_service.reset_all_data_quality_rules($scope.org.org_id).then(function (rules) {
        loadRules(rules);
        $scope.rules_reset = true;
      }, function (data) {
        $scope.$emit('app_error', data);
      }).finally(function () {
        spinner_utility.hide();
      });
    };

    // Saves the configured rules
    $scope.save_settings = function () {
      $scope.rules_updated = false;
      var rules = {
        properties: [],
        taxlots: []
      };
      _.forEach($scope.ruleGroups, function (ruleGroups, inventory_type) {
        _.forEach(ruleGroups, function (ruleGroup) {
          _.forEach(ruleGroup, function (rule) {
            var r = {
              enabled: rule.enabled,
              field: rule.field,
              data_type: rule.data_type,
              rule_type: rule.rule_type,
              required: rule.required,
              not_null: rule.not_null,
              min: rule.min || null,
              max: rule.max || null,
              text_match: rule.text_match,
              severity: rule.severity,
              units: rule.units,
              label: null
            };
            if (rule.data_type === 'date') {
              if (rule.min) r.min = Number(moment(rule.min).format('YYYYMMDD'));
              if (rule.max) r.max = Number(moment(rule.max).format('YYYYMMDD'));
            }
            if (rule.label) {
              // console.log('la: ', rule.label)
              r.label = rule.label.id;
            }
            if (rule.new) {
              rule.new = null;
              var match = _.find(labels_payload, function (label) {
                return label.name === rule.label;
              });

              if (match) {
                r.label = match.id;
              }
            }
            rules[inventory_type].push(r);
          });
        });
      });

      data_quality_service.save_data_quality_rules($scope.org.org_id, rules).then(function (data) {
        $scope.rules_updated = true;
      }, function (data) {
        $scope.$emit('app_error', data);
      });
    };

    // capture rule field dropdown change.
    $scope.change_field = function (rule, oldField, index) {
      var original = rule.data_type;
      var newDataType = _.find(columns, {name: rule.field}).data_type;

      if (newDataType == undefined) newDataType = null;

      // clear columns that are type specific.
      if (newDataType !== original) {
        rule.text_match = null;
        rule.units = '';

        if (!_.includes([null, 'number'], original) || !_.includes([null, 'number'], newDataType)) {
          // Reset min/max if the data type is something other than null <-> number
          rule.min = null;
          rule.max = null;
        }
      }

      rule.data_type = newDataType;

      // move rule to appropriate spot in ruleGroups.
      if (!_.has($scope.ruleGroups[$scope.inventory_type], rule.field)) $scope.ruleGroups[$scope.inventory_type][rule.field] = [];
      else {
        // Rules already exist for the new field name, so match the data_type, required, and not_null columns
        var existingRule = _.first($scope.ruleGroups[$scope.inventory_type][rule.field]);
        rule.data_type = existingRule.data_type;
        rule.required = existingRule.required;
        rule.not_null = existingRule.not_null;
      }
      $scope.ruleGroups[$scope.inventory_type][rule.field].push(rule);
      // remove old rule.
      if ($scope.ruleGroups[$scope.inventory_type][oldField].length === 1) delete $scope.ruleGroups[$scope.inventory_type][oldField];
      else $scope.ruleGroups[$scope.inventory_type][oldField].splice(index, 1);
      rule.autofocus = true;
    };

    // Keep field types consistent for identical fields
    $scope.change_data_type = function (rule, oldValue) {
      var data_type = rule.data_type;
      _.forEach($scope.ruleGroups[$scope.inventory_type][rule.field], function (currentRule) {
        currentRule.text_match = null;

        if (!_.includes(['', 'number'], oldValue) || !_.includes([null, 'number'], data_type)) {
          // Reset min/max if the data type is something other than null <-> number
          currentRule.min = null;
          currentRule.max = null;
        }
        currentRule.data_type = data_type;
      });
    };

    // Keep "required field" consistent for identical fields
    $scope.change_required = function (rule) {
      var required = !rule.required;
      _.forEach($scope.ruleGroups[$scope.inventory_type][rule.field], function (currentRule) {
        currentRule.required = required;
      });
    };

    // Keep "not null" consistent for identical fields
    $scope.change_not_null = function (rule) {
      var not_null = !rule.not_null;
      _.forEach($scope.ruleGroups[$scope.inventory_type][rule.field], function (currentRule) {
        currentRule.not_null = not_null;
      });
    };

    $scope.removeLabelFromRule = function (rule) {
      rule.label = null;
    }

    // create a new rule.
    $scope.create_new_rule = function () {
      var field = _.get(columns, '[0].name', null);
      var displayName = _.get(columns, '[0].displayName', '');
      var data_type = _.get(columns, '[0].dataType', null);

      if (field) {
        if (!_.has($scope.ruleGroups[$scope.inventory_type], field)) {
          $scope.ruleGroups[$scope.inventory_type][field] = [];
        } else {
          data_type = _.first($scope.ruleGroups[$scope.inventory_type][field]).data_type;
        }

        $scope.ruleGroups[$scope.inventory_type][field].push({
          enabled: true,
          field: field,
          displayName: displayName,
          data_type: data_type,
          rule_type: 1,
          required: false,
          not_null: false,
          max: null,
          min: null,
          text_match: null,
          severity: 'error',
          units: '',
          // label: 'Invalid ' + label,
          label: null,
          'new': true,
          autofocus: true
        });
      }
    };

    // create label and assign to that rule
    $scope.create_label = function (rule, index) {
        var modalInstance = $uibModal.open({
          templateUrl: urls.static_url + 'seed/partials/data_quality_labels_modal.html',
          controller: 'data_quality_labels_modal_controller',
          resolve: { }
        });
        modalInstance.result.then(function (returnedLabels) {
            
            rule.label = returnedLabels;

            //code for multiple labels
            // label_service.get_labels().then(function (allLabels) {
            //   console.log('all: ', allLabels)
            //   rule.label = _.filter(allLabels, function (label) {
            //     // console.log(label.id + ' and ' + returnedLabels)
            //     return _.includes(returnedLabels, label.id);
            //   });
            // });


          }, function (message) {
            //dialog was 'dismissed,' which means it was cancelled...so nothing to do.
          }
        );      
      //   var newLabel = {
      //     name: rule.label,
      //     color: 'gray',
      //     label: 'default'
      //   };
      //   label_service.create_label_for_org($scope.org.id, newLabel).then(angular.bind(this, function (result) {
      //       r.label = result.id;
      //       rules[rule_type].push(r);
      //       d.resolve();
      //     }, rule_type),
      //     function (message) {
      //       $log.error('Error creating new label.', message);
      //       d.reject();
      //     }).then(function () {
      //       label_service.get_labels_for_org($scope.org.id).then(function (labels) {
      //         $scope.all_labels = labels;
      //       });
      //     });
      // }
    };

    // set rule as deleted.
    $scope.delete_rule = function (rule, index) {
      if ($scope.ruleGroups[$scope.inventory_type][rule.field].length === 1) delete $scope.ruleGroups[$scope.inventory_type][rule.field];
      else $scope.ruleGroups[$scope.inventory_type][rule.field].splice(index, 1);
    };
  }]);
