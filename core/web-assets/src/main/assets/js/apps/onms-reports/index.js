const angular = require('vendor/angular-js');
require('../../lib/onms-http');
require('angular-ui-router');

const indexTemplate  = require('./index.html');
const templatesTemplate  = require('./templates.html');
const persistedtTemplate  = require('./persisted.html');
const schedulesTemplate  = require('./schedules.html');
const detailsTemplate  = require('./details.html');
const successModalTemplate  = require('./modals/success-modal.html');
const errorModalTemplate  = require('./modals/error-modal.html');

(function() {
    'use strict';

    var MODULE_NAME = 'onms.reports';

    angular.module(MODULE_NAME, [
            'angular-loading-bar',
            'ngResource',
            'ui.router',
            'onms.http',
        ])
        .config( ['$locationProvider', function ($locationProvider) {
            $locationProvider.hashPrefix('!');
            $locationProvider.html5Mode(false);
        }])
        .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
            $stateProvider
                .state('report', {
                    url: '/report',
                    controller: 'ReportsController',
                    templateUrl: indexTemplate
                })
                .state('report.templates', {
                    url: '/templates',
                    controller: 'ReportTemplatesController',
                    templateUrl: templatesTemplate
                })
                .state('report.details', {
                    url: '/:id?type',
                    controller: 'ReportDetailController',
                    templateUrl: detailsTemplate,
                    resolve: {

                    }
                })
                .state('report.schedules', {
                    url: '/schedules',
                    controller: 'ReportSchedulesController',
                    templateUrl: schedulesTemplate
                })
                .state('report.persisted', {
                    url: '/persisted',
                    controller: 'ReportStorageController',
                    templateUrl: persistedtTemplate
                })
            ;
            $urlRouterProvider.otherwise('/report/templates');
        }])
        .factory('ReportTemplateResource', function($resource) {
            return $resource('rest/reports/:id', {id: '@id'},
                {
                    'list':             { method: 'GET', isArray: true },
                    'get':              { method: 'GET' },
                    'listScheduled':    { method: 'GET', isArray:true, url:'rest/reports/scheduled'}
                }
            );
        })
        .factory('ReportScheduleResource', function($resource) {
            return $resource('rest/reports/scheduled/:id', {id: '@id'},
                {
                    'list':             { method: 'GET', isArray: true },
                    'get':              { method: 'GET' },
                    'delete':           { method: 'DELETE', params: {id: -1} /* to prevent accidentally deleting all */ },
                    'deleteAll':        { method: 'DELETE'},
                }
            );
        })
        .factory('ReportStorageResource', function($resource) {
            return $resource('rest/reports/persisted/:id', {id: '@id'},
                {
                    'list':             { method: 'GET', isArray: true },
                    'get':              { method: 'GET' },
                    'delete':           { method: 'DELETE', params: {id: -1} /* to prevent accidentally deleting all */ },
                    'deleteAll':        { method: 'DELETE'},
                }
            );
        })
        .factory('UserResource', function($resource) {
            return $resource('rest/users/whoami', {}, {'whoami': {method: 'GET'}});
        })
        .factory('UserService', function(UserResource) {
            return {
                whoami: function(successCallback, errorCallback) {
                    return UserResource.whoami(function(data) {
                        var user = {
                            id: data['user-id'],
                            name: data['full-name'],
                            email: data['email'],
                            roles: data['role'],

                            isAdmin: function() {
                                return this.roles.indexOf("ROLE_ADMIN") >= 0;
                            },

                            isReportDesigner: function() {
                                return this.roles.indexOf("ROLE_REPORT_DESIGNER") >= 0;
                            }
                        };
                        if (successCallback) {
                            successCallback(user);
                        }
                    }, function(error) {
                        if (errorCallback) {
                            errorCallback(error);
                        }
                    });
                }
            };  
        })
        // TODO MVR verify global error handling is the way to go here for all error responses. Maybe we need a little bit more differentiated
        .controller('ReportsController', ['$scope', '$http', 'UserService', function($scope, $http, UserService) {
            $scope.fetchUserInfo = function() {
                UserService.whoami(function(user) {
                    $scope.userInfo = user;
                }, function(error) {
                    $scope.handleGlobalError(error);
                });
            };

            $scope.handleGlobalError = function(errorResponse) {
                console.log("An unexpected error occurred", errorResponse);
                $scope.globalError = "An unexpected error occurred: " + errorResponse.statusText + "(" + errorResponse.status + ")";
                $scope.globalErrorDetails = JSON.stringify(errorResponse, null, 2);
            };

            $scope.fetchUserInfo();
        }])
        .controller('ReportTemplatesController', ['$scope', '$http', 'ReportTemplateResource', function($scope, $http, ReportTemplateResource) {
            $scope.refresh = function() {
                $scope.reports = [];
                $scope.globalError = undefined;

                ReportTemplateResource.list(function(response) {
                    if (response && Array.isArray(response)) {
                        $scope.reports = response;
                    }
                }, function(errorResponse) {
                    $scope.handleGlobalError(errorResponse);
                })
            };

            $scope.refresh();

        }])
        .controller('ReportDetailController', ['$scope', '$http', '$window', '$state', '$stateParams', '$uibModal', 'ReportTemplateResource', function($scope, $http, $window, $state, $stateParams, $uibModal, ReportTemplateResource) {
            $scope.type = $stateParams.type;
            $scope.reportId = $stateParams.id;
            $scope.cron = {
                expression :  "0 */5 * * * ?"
            }; // TODO MVR ???

            $scope.loadDetails = function() {
                $scope.loading = true;
                $scope.surveillanceCategories = [];
                $scope.categories = [];
                $scope.formats = [];
                $scope.reportFormat = "PDF";
                $scope.parameters = [];
                $scope.endpoints = [];
                $scope.dashboards = [];
                $scope.deliveryOptions = undefined;

                var requestParameters = {
                    id: $scope.reportId,
                    adhoc: $scope.type === 'online',
                    userId: $scope.type !== 'online' ? $scope.userInfo.id : undefined
                };

                ReportTemplateResource.get(requestParameters, function(response) {
                    $scope.loading = false;
                    $scope.surveillanceCategories = response.surveillanceCategories;
                    $scope.categories = response.categories;
                    $scope.formats = response.formats;
                    $scope.parameters = response.parameters;
                    $scope.deliveryOptions = response.deliveryOptions || {};
                    $scope.deliveryOptions.format = $scope.reportFormat;

                    // In order to have the ui look the same as before, just order the parameters
                    var order = ['string', 'integer', 'float', 'double', 'date'];
                    $scope.parameters.sort(function(left, right) {
                        return order.indexOf(left.type) - order.indexOf(right.type);
                    });

                    // Apply default values for categories
                    $scope.parameters.forEach(function(item) {
                        if (item.inputType === 'reportCategorySelector') {
                            item.value = $scope.surveillanceCategories[0];
                        }
                        if (item.inputType === 'onmsCategorySelector') {
                            item.value = $scope.categories[0];
                        }
                    })
                }, function(response) {
                    $scope.loading = false;
                    $scope.handleGlobalError(response);
                });
            };

            // TODO MVR use ReportTemplateResource for this, but somehow only $http works :-/
            // TODO MVR it seems always pdf is generated even if csv was selected
            $scope.runReport = function() {
                $http({
                    method: 'POST',
                    url: 'rest/reports/' + $stateParams.id,
                    data:  {id:$scope.reportId, parameters: $scope.parameters, format: $scope.reportFormat},
                    responseType:  'arraybuffer'
                }).then(function (response) {
                        console.log("SUCCESS", response);
                        var data = response.data;
                        var fileBlob = new Blob([data], {type: $scope.reportFormat === 'PDF' ? 'application/pdf' : 'text/csv'});
                        var fileURL = URL.createObjectURL(fileBlob);
                        var contentDisposition = response.headers("Content-Disposition");
                        // var filename = (contentDisposition.split(';')[1].trim().split('=')[1]).replace(/"/g, '');
                        console.log(contentDisposition);
                        var filename = $stateParams.id + '.' + $scope.reportFormat.toLowerCase();

                        var a = document.createElement('a');
                        document.body.appendChild(a);
                        a.style = 'display: none';
                        a.href = fileURL;
                        a.download = filename;
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                    },
                    function(error) {
                        console.log("ERROR", error);
                    });
            };

            $scope.showSuccessModal = function(scope) {
                return $uibModal.open({
                    templateUrl: successModalTemplate,
                    backdrop: 'static',
                    keyboard: false,
                    size: 'md',
                    controller: function($scope, type) {
                        $scope.type = type;
                        $scope.goToSchedules = function() {
                            $scope.$close();
                            $state.go('report.schedules');
                        };
                        $scope.goToPersisted = function() {
                            $scope.$close();
                            $state.go('report.persisted');
                        }
                    },
                    resolve: {
                        type: function() {
                            return scope.type;
                        }
                    },
                });
            };

            $scope.showErrorModal = function(scope, errorResponse) {
                var modal = $uibModal.open({
                    templateUrl: errorModalTemplate,
                    backdrop: 'static',
                    keyboard: false,
                    size: 'md',
                    controller: function($scope, errorResponse, type) {
                        $scope.type = type;
                        if (errorResponse && errorResponse.data && errorResponse.data.message) {
                            $scope.errorMessage = errorResponse.data.message;
                        }
                    },
                    resolve: {
                        type: function() {
                            return scope.type;
                        },
                        errorResponse: function() {
                            return errorResponse;
                        }
                    },
                });
                return modal;
            };

            $scope.deliverReport = function() {
                $http({
                    method: 'POST',
                    url: 'rest/reports/persisted',
                    data: {
                        id: $scope.reportId,
                        parameters: $scope.parameters,
                        format: $scope.reportFormat,
                        deliveryOptions: $scope.deliveryOptions
                    }
                }).then(function(response) {
                    $scope.showSuccessModal($scope);
                }, function(errorResponse) {
                    $scope.showErrorModal($scope, errorResponse);
                })
            };

            $scope.scheduleReport = function() {
                $http({
                    method: 'POST',
                    url: 'rest/reports/scheduled',
                    data: {
                        id: $scope.reportId,
                        parameters: $scope.parameters,
                        format: $scope.reportFormat,
                        deliveryOptions: $scope.deliveryOptions,
                        cronExpression: $scope.cron.expression
                    }
                }).then(function(response) {
                    $scope.showSuccessModal($scope);
                }, function(errorResponse) {
                    $scope.showErrorModal($scope, errorResponse);
                })
            };

            $scope.execute = function() {
                if ($scope.type === 'online') {
                    $scope.runReport();
                }
                if ($scope.type === 'schedule') {
                    $scope.scheduleReport();
                }
                if ($scope.type === 'deliver') {
                    $scope.deliverReport();
                }
            };

            // We wait for the userInfo to be set, otherwise loading
            // cannot be performed as we don't have a user id
            $scope.$watch("userInfo", function(newVal, oldVal) {
                if (newVal) {
                    $scope.loadDetails();
                }
            });
        }])
        .controller('ReportSchedulesController', ['$scope', '$http', '$window', '$stateParams', 'ReportScheduleResource', function($scope, $http, $window, $stateParams, ReportScheduleResource) {
            $scope.scheduledReports = [];
            $scope.refresh = function() {
                ReportScheduleResource.list(function(data) {
                    $scope.scheduledReports = data;
                }, function(response) {
                    $scope.handleGlobalError(response);
                });
            };

            $scope.deleteAll = function() {
                ReportScheduleResource.deleteAll({}, function(response) {
                   $scope.refresh();
                }, function(response) {
                    $scope.handleGlobalError(response);
                });
            };

            $scope.delete = function(schedule) {
                ReportScheduleResource.delete({id: schedule.triggerName || -1}, function(response) {
                    $scope.refresh();
                }, function(response) {
                    $scope.handleGlobalError(response);
                })
            };

            $scope.refresh();
        }])
        .controller('ReportStorageController', ['$scope', '$http', '$window', '$stateParams', 'ReportStorageResource', function($scope, $http, $window, $stateParams, ReportStorageResource) {
            $scope.persistedReports = [];
            $scope.refresh = function() {
                ReportStorageResource.list(function(data) {
                    $scope.persistedReports = data;
                }, function(response) {
                    $scope.handleGlobalError(response);
                });
            };

            $scope.deleteAll = function() {
                ReportStorageResource.deleteAll({}, function(response) {
                    $scope.refresh();
                }, function(response) {
                    $scope.handleGlobalError(response);
                });
            };

            $scope.delete = function(report) {
                ReportStorageResource.delete({id: report.id || -1}, function(response) {
                    $scope.refresh();
                }, function(response) {
                    $scope.handleGlobalError(response);
                })
            };

            $scope.refresh();
        }])
    ;
}());
