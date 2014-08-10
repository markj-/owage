/*global Mustache, publish, subscribe*/

window.log=function(){log.history=log.history||[];log.history.push(arguments);if(this.console){console.log(Array.prototype.slice.call(arguments));}};

(function( window, document, undefined ) {
  'use strict';

  var $ = document.querySelectorAll.bind( document );
  Element.prototype.on = Element.prototype.addEventListener;

  function getInputValue( input ) {
    return {
      key: input.name,
      value: input.value
    };
  }

  function getFormData( form ) {
    var inputs = Array.prototype.slice.call( form.querySelectorAll( 'input, select, textarea' ) ),
      values = inputs.map( getInputValue );
    return values;
  }

  var Storage = {};

  Storage.save = function( key, value ) {
    value = typeof value === 'object' ? JSON.stringify( value ) : value;
    window.localStorage.setItem( key, value );
  };

  Storage.load = function( key ) {
    return JSON.parse( window.localStorage.getItem( key ) );
  };

  var AddFormController = function() {
    this.formView = this.getFormView();
    this.listenToFormView();
  };

  AddFormController.fn = AddFormController.prototype;

  AddFormController.fn.getFormView = function() {
    var formView = new AddFormView();
    return formView;
  };

  AddFormController.fn.listenToFormView = function() {
    subscribe(
      'form:view:add:transaction',
      this.addTransaction.bind( this )
    );
    subscribe(
      'form:view:clear:inputs',
      this.clearFormViewInputs.bind( this )
    );
  };

  AddFormController.fn.transformData = function( inputs ) {
    var transformedData = {};
    inputs.forEach(function( input ) {
      transformedData[ input.key.replace( 'transaction-', '' ) ] = input.value;
    });
    return transformedData;
  };

  AddFormController.fn.addTransaction = function() {
    var formData = getFormData( this.formView.ui.el ),
      newTransaction = this.transformData( formData ),
      storedTransactions = Storage.load( 'transactions' ) || [];

    storedTransactions.push( newTransaction );
    Storage.save( 'transactions', storedTransactions );
  };

  AddFormController.fn.clearFormViewInputs = function() {
    this.formView.clearInputs();
  };

  var AddFormView = function() {
    this.ui = {};
    this.bindUIComponents();
    this.bindEvents();
  };

  AddFormView.fn = AddFormView.prototype;

  AddFormView.fn.clearInputs = function() {
    this.ui.inputs.forEach(function( input ) {
      input.value = '';
    });
  };

  AddFormView.fn.bindUIComponents = function() {
    this.ui.el = $( '.transaction-form' )[ 0 ];
    this.ui.inputs = Array.prototype.slice.call( this.ui.el.querySelectorAll( 'input, textarea' ) );
  };

  AddFormView.fn.bindEvents = function() {
    this.ui.el.addEventListener( 'submit', this.addTransaction.bind( this ) );
  };

  AddFormView.fn.addTransaction = function( e ) {
    e.preventDefault();
    publish( 'form:view:add:transaction' );
    publish( 'transaction:list:view:render' );
    publish( 'form:view:clear:inputs' );
  };

  var TransactionListController = function() {
    this.listView = this.getListView();
    this.renderListView();
    this.listenToListView();
  };

  TransactionListController.fn = TransactionListController.prototype;

  TransactionListController.fn.getDataSource = function() {
    return Storage.load( 'transactions' );
  };

  TransactionListController.fn.getListView = function() {
    return new TransactionListView();
  };

  TransactionListController.fn.listenToListView = function() {
    subscribe(
      'transaction:list:view:render',
      this.renderListView.bind( this )
    );
  };

  TransactionListController.fn.renderListView = function() {
    this.listView.dataSource = this.getDataSource();
    this.listView.render();
  };

  var TransactionListView = function() {
    this.ui = {};
    this.tmpl = $( '#transaction-list-tmpl' )[ 0 ].innerText;
    this.bindUIComponents();
  };

  TransactionListView.fn = TransactionListView.prototype;

  TransactionListView.fn.bindUIComponents = function() {
    this.ui.el = $( '.transaction-list' )[ 0 ];
  };

  TransactionListView.fn.render = function() {
    this.ui.el.innerHTML = Mustache.render( this.tmpl, {
      transactions: this.dataSource,
      numTransactions: this.dataSource && this.dataSource.length
    });
  };

  var OWAGE = function() {
    this.Controllers = [];
  };

  OWAGE.fn = OWAGE.prototype;

  OWAGE.fn.init = function() {
    this.Controllers.push( new AddFormController() );
    this.Controllers.push( new TransactionListController() );
  };

  var owage = new OWAGE();

  document.addEventListener( 'DOMContentLoaded', owage.init.bind( owage ) );
})( window, document );