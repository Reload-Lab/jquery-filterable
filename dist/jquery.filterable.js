// JavaScript Document

/**
 * Filterable utilites
 */
(function($){
	"use strict";
	
	// Utils plugin
	$.fn.filterableUtils = {
		
		// Se value è undefined o null, la funzione restituisce true
		isNull: function(value)
		{
			if(value === undefined || value === null){
				
				return true;
			}
			
			return false;
		},
		
		// Se value è undefined o null, la funzione restituisce false
		notNull: function(value)
		{
			return !this.isNull(value);
		}
	};
}(jQuery));

/**
 * FilterableCell
 */
(function($){
	"use strict";
	
	// Costruttore
	var FilterableCell = function(cell, options)
	{
		this.$cell = $(cell); // jquery cella
		this.match = null; // proprietà match
		
		// Oggetto opzioni
		this.options = $.extend({}, $.fn.filterableCell.defaults, options);
		
		// Chiama il metodo init
		this.init();
	};
	
	FilterableCell.prototype = {
		
		/**
		Metodo costruttore
		@method constructor()
		**/
		constructor: FilterableCell,
		
		/**
		Ritorna il testo della cella
		@method value()
		**/
		value: function()
		{
			return this.$cell.text();
		},

		/**
		Imposta le classi match e mismatch
		a seconda della corrispondenza con la query
		@method setMatch()
		**/
		setMatch: function(match)
		{
			// Se ha trovato una corrispondenza nella cella...
			if(match){
				
				// Imposta classi css
				this.$cell.addClass('filterable-match');
				this.$cell.removeClass('filterable-mismatch');
			}
			// Altrimenti
			else{
				
				// Imposta classi css
				this.$cell.addClass('filterable-mismatch');
				this.$cell.removeClass('filterable-match');
			}
		},
    	
		/**
		Verifica la corrispondenza con la query
		@method isMatch()
		**/
		isMatch: function(query)
		{
			// Se è presente una funzione personalizzata per il matching...
			if(typeof this.options.isMatch === 'function'){
				
				// Esegue la funzione personalizzata passando la cella e la query
				this.match = this.options.isMatch(this.$cell, query);
			}
			// Altrimenti
			else{
				
				// Se si stanno cercando le celle vuote...
				if(query == '\\\NULL'){
					
					// Empty cell regex
					query = '^\\\s*$';
				}
				// Altrimenti
				else{
					
					// Clear query
					query = query.replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g, '\\$&');
					query = query.replace(/\*/, '.*');
					query = '.*' + query + '.*';
				}
				
				// Set case insensitive in regexp
				var options = this.options.ignoreCase? 'i': '';
				var regex = new RegExp(query, options);
				
				// Imposta la proprietà match della cella su true o false
				// a seconda che sia stata trovata o meno una corrispondenza
				this.match = regex.test(this.value()) === true;
			}
			
			// Imposta le classi css sulla cella
			this.setMatch(this.match);
			
			// Ritorna un booleano
			return this.match;
		},
		
		/**
		Inizializza il filtro di cella
		@method init()
		**/
		init: function()
		{
			// Add 'filterable-cell' class to every cell element
			this.$cell.addClass('filterable-cell');

			// Finilize init
			$.proxy(function()
			{
				/**
				Fired when element was initialized by `$().filterable()` method.
				Please note that you should setup `init` handler **before** applying `filterable`.
							  
				@event init
				@param {Object} event event object
				@param {Object} editable filterable instance (as here it cannot accessed via data('editable'))
				**/
				this.$element.triggerHandler('init', this);
			}, this);
		},

		/**
		Removes filterableCell from element
		@method destroy()
		**/
		destroy: function()
		{
			this.$cell.removeClass('filterable-cell filterable-match filterable-mismatch');
			this.$cell.removeData('fitlerableCell');
		}
	};

	// Initilize each filterable cell
	$.fn.filterableCell = function(option)
	{
		// Special API methods returning non-jquery object
		var args = arguments, 
			datakey = 'filterableCell';
    
		// Return jquery object
		return this.each(function()
		{
			var $this = $(this), // cella
				data = $this.data(datakey), // oggetto FilterableCell
				options = typeof option === 'object' && option; // opzioni
			
			// Se l'oggetto FilterableCell non è stato inizializzato...
			if(!data){
				
				// Inizializza l'oggetto FilterableCell e lo assegna alla tabella
				$this.data(datakey, (data = new FilterableCell(this, options)));
			}
			
			// Se opzione è una stringa...
			if(typeof option === 'string'){
				
				// Chiama un metodo dell'oggetto FilterableCell
				data[option].apply(data, Array.prototype.slice.call(args, 1));
			}
		});
	};
	
	// Default options
	$.fn.filterableCell.defaults = {
		
		/**
		Function to determine if the cell matches the user supplied filter.
		
		@property isMatch($cell, query)
		@type function
		@default null
		@example
		isMatch: function($cell, query) {
		  var regex = RegExp('.*' + query + '.*');
		  return regex.text( cell.text() );
		}
		**/
		isMatch: null
	};
})(jQuery);

/**
 * FilterableRow
 */
(function($){
	"use strict";
	
	// Costruttore
	var FilterableRow = function(row, options)
	{
		this.$row = $(row); // jquery riga
		this.cells = []; // array cells
		
		// Oggetto opzioni
		this.options = $.extend({}, $.fn.filterableRow.defaults, options);
		
		// Chiama il metodo init
		this.init();
	};
  
	FilterableRow.prototype = {
		
		/**
		Metodo costruttore
		@method constructor()
		**/
		constructor: FilterableRow,
    
		/**
		Ritorna una cella della riga in base al numero di colonna (index)
		@method cell()
		**/
		cell: function(index)
		{
			return this.cells[index];
		},

		/**
		Imposta le classi match e mismatch
		a seconda della corrispondenza con la query
		@method setMatch()
		**/
		setMatch: function(match)
		{
			// Se ha trovato una corrispondenza in una cella della riga...
			if(match){
				
				// Imposta classi css
				this.$row.addClass('filterable-match');
				this.$row.removeClass('filterable-mismatch');
			}
			// Altrimenti...
			else{
				
				// Imposta classi css
				this.$row.addClass('filterable-mismatch');
				this.$row.removeClass('filterable-match');
			}
		},

		/**
		Ritorna true se non è stata trovata corrispondenza
		@method hasMismatch()
		**/
		hasMismatch: function()
		{
			var nonMatch = false;
			
			// Cicla tutte le celle della colonna
			$.each(this.cells, $.proxy(function(index, cell)
			{
				// Se la cella non è esclusa 
				// e non ha corrispondenza con la query...
				if($.fn.filterableUtils.notNull(cell) 
					&& cell.match === false
				){
					nonMatch = true;
					return;
				}
			}, this));
			
			return nonMatch;
		},
		
		/**
		Filtro per cella
		Prende come valori la query (query)
		e il numero della cella da filtrare (cellIndex)
		@method filter()
		**/
		filter: function(query, index)
		{
			this.cells[index].isMatch(query);
			this.setMatch(!this.hasMismatch());
		},
    	
		/**
		Esclude le colonne da non filtrare
		@method ignoredColumn()
		**/
		ignoredColumn: function(index)
		{
			if($.fn.filterableUtils.notNull(this.options.onlyColumns)){
				
				return $.inArray(index, this.options.onlyColumns) === -1;
			}
			
			return $.inArray(index, this.options.ignoreColumns) !== -1;
		},
		
		/**
		Inizializza il filtro di riga
		@method init()
		**/
		init: function()
		{
			// Add 'filterable-row' class to every filterable row
			this.$row.addClass('filterable-row');
        
			// Init Cells
			var newCell;
			
			// Cicla tutti i TD della riga
			this.$row.children('td')
				.each($.proxy(function(index, cell)
				{
					// Se la cella è filtrabile...
					if(!this.ignoredColumn(index)){
						
						// Inizializza l'oggetto FilterableCell
						$(cell).filterableCell(this.options);
						
						// Aggiunge l'oggetto FilterableCell all'elemento TD
						newCell = $(cell).data('filterableCell');
					} 
					// Altrimenti...
					else{
						
						newCell = null;
					}
					
					// Aggiunge l'oggetto FilterableCell all'array cells
					this.cells.push(newCell);
				}, this));
        
			// Finilize init
			$.proxy(function()
			{
				/**
				Fired when row was initialized by `$().filterableRow()` method.
				Please note that you should setup `init` handler **before** applying `filterable`.
							  
				@event init
				@param {Object} event event object
				@param {Object} editable filterable instance (as here it cannot accessed via data('editable'))
				**/
				this.$row.triggerHandler('init', this);
			}, this);
		},

		/**
		Removes filterable row from element
		@method destroy()
		**/
		destroy: function()
		{
			this.$row.removeClass('filterable-row filterable-match filterable-mismatch');
			this.$row.removeData('fitlerableRow');
		}
	};

	// Initilize each filterable row
	$.fn.filterableRow = function(option)
	{
		// Special API methods returning non-jquery object
		var args = arguments, 
			datakey = 'filterableRow';
    
		// Return jquery object
		return this.each(function()
		{
			var $this = $(this), // riga
				data = $this.data(datakey), // oggetto FilterableRow
				options = typeof option === 'object' && option; // opzioni
			
			// Se l'oggetto FilterableRow non è stato inizializzato...
			if(!data){
				
				// Inizializza l'oggetto FilterableRow e lo assegna alla tabella
				$this.data(datakey, (data = new FilterableRow(this, options)));
			}
			
			// Se opzione è una stringa...
			if(typeof option === 'string'){
				
				// Chiama un metodo dell'oggetto FilterableRow
				data[option].apply(data, Array.prototype.slice.call(args, 1));
			}
		});
	};
	
	// Default options
	$.fn.filterableRow.defaults = {};
})(jQuery);

/**
 * Filterable
 */
(function($){
	"use strict";
	
	// Costruttore
	var Filterable = function(element, options)
	{
		this.$element = $(element); // jquery tabella
		this.rows = null; // array rows
		this.popovers = null; // array popover
		this.queries = {}; // oggetto queries
		
		// Oggetto opzioni
		this.options = $.extend({}, $.fn.filterable.defaults, options);
		
		// Chiama il metodo init
		this.init();
	};
  
	Filterable.prototype = {
		
		/**
		Metodo costruttore
		@method constructor()
		**/
		constructor: Filterable,

		/**
		Esclude le colonne da non filtrare
		@method ignoredColumn()
		**/
		ignoredColumn: function(index)
		{
			if($.fn.filterableUtils.notNull(this.options.onlyColumns)){
				
				return $.inArray(index, this.options.onlyColumns) === -1;
			}
			
			return $.inArray(index, this.options.ignoreColumns) !== -1;
		},

		/**
		Ritorna la variabile della query string
		@method filterHash()
		**/
		filterHash: function(index)
		{
			var tableId = this.$element.attr('id');
			
			if(tableId != ''){
				
				return 'filter_' + tableId + '_' + index;
			}
			
			return 'filter_' + '_' + index;
		},

		/**
		Raccoglie tutte le righe nell'array rows
		@method initRows()
		**/
		initRows: function()
		{
			this.rows = [];
			
			// Cicla tutti i TR, esclusa la prima riga 
			this.$element.children('tbody,*')
				.children('tr')
				.each($.proxy(function(rowIndex, row)
				{
					if(rowIndex !== 0){
						
						// Inizializza l'oggetto FilterableRow
						$(row).filterableRow(this.options);
						
						// Aggiunge l'oggetto FilterableRow all'array rows
						this.rows.push($(row).data('filterableRow'));
					}
				}, this));
		},

		/**
		Genera l'array da passare a autocomplete plugin
		@method autocompleteValues()
		**/
		autocompleteValues: function(cellIndex)
		{
			var keys = {};
			
			// Se le righe non sono state ancora raccolte nell'array rows...
			if($.fn.filterableUtils.isNull(this.rows)){
				
				this.initRows();
			}
			
			// Cicla tutte le righe 
			$.each(this.rows, $.proxy(function(rowIndex, row)
			{
				// Include solo le righe che hanno qualche corrispondenza con la query
				if(!row.hasMismatch()){
					
					// Assegna una proprietà all'oggetto keys
					// In questo modo evita i doppioni
					keys[row.cell(cellIndex).value()] = '';
				}
			}, this));
			
			// Trasforma l'oggetto keys in un array
			return $.map(keys, function(value, key)
			{
				return key;
			});
		},

		/**
		Filtro per colonna
		Prende come valori la query (query)
		e il numero della colonna da filtrare (cellIndex)
		@method filter()
		**/
		filter: function(query, cellIndex)
		{
			// Se esiste la funzione beforeFilter...
			if(typeof this.options.beforeFilter === 'function'){
				
				this.options.beforeFilter(this.$element, cellIndex, query);
			}
			
			// Se le righe non sono state ancora raccolte nell'array rows...
			if($.fn.filterableUtils.isNull(this.rows)){
				
				this.initRows();
			}

			// Cicla tutte le righe 
			$.each(this.rows, $.proxy(function(rowIndex, row)
			{
				// Su ogni riga esegue il filtro sulla cella sotto esame
				row.filter(query, cellIndex);
			}, this));
			
			// Inserisce la query nell'oggetto queries
			this.queries[cellIndex] = query;
			
			// Se esiste la funzione afterFilter...
			if(typeof this.options.afterFilter === 'function'){
				
				this.options.afterFilter(this.$element, cellIndex, query);
			}
		},

		/**
		Funzione collegata all'evento onFilter
		@method onFilter()
		**/
		onFilter: function(popoverToggle, query, index)
		{
			var state = {};
			
			// Se il campo input è vuoto...
			if(query === ''){
				
				// Remove the state
				$.bbq.removeState(this.filterHash(index));
				
				// Rimuove la classe 'filterable-active'
				$(popoverToggle).removeClass('filterable-active');
			} 
			// Altrimenti...
			else{
				
				// Set the state
				state[this.filterHash(index)] = query;
				$.bbq.pushState(state);
				
				// Aggiunge la classe 'filterable-active'
				$(popoverToggle).addClass('filterable-active');
			}
		
			// Elimina il popover
			$(popoverToggle).popover('hide');

			// Salva l'ultimo valore input con il valore query
			this.popovers[index].input(query);
			
			// Filtra passando la query (params.newValue) 
			// e il numero della colonna da filtrare (index)
			this.filter(query, index);
		},

		/**
		La funzione chiude tutti i popover aperti (in genere uno solo alla volta)
		@method closePopovers()
		**/
		closePopovers: function(e)
		{
			// Cicla tutti i popover
			$('[data-toggle="popover"]').each(function()
			{
				// Hide any open popovers when the anywhere else in the body is clicked
				if(!$(this).is(e.target) 
					&& $(this).has(e.target).length === 0 
					&& $('.popover').has(e.target).length === 0
				){
					$(this).popover('hide');
				}
			});
		},

		/**
		Funzione collegata all'evento hashchange
		@method hashChange()
		**/
		hashChange: function(popover, index)
		{
			var filterHash = this.filterHash(index),
				query = $.bbq.getState(filterHash) || '';
				
			// Imposta il valore del campo di ricerca con il valore di query
			popover.input(query);
			
			// Se query è una stringa vuota...
			if(query !== ''){
				
				// Assegna la classe css active all'elemento toggle del popover
				popover.$heading.addClass('filterable-active');
			}
			// Altrimenti...
			else{
				
				// Rimuove la classe css active all'elemento toggle del popover
				popover.$heading.removeClass('filterable-active');
			}
			
			// Se query è uguale al corrispondente valore in queries
			if(typeof this.queries[index] == 'undefined' 
				|| query == this.queries[index]
			){
				return;	
			}
			
			// Filtra passando la query (query) 
			// e il numero della colonna da filtrare (index)
			this.filter(query, index);
		},

		/**
		Inizializza il filtro
		@method init()
		**/
		init: function()
		{
			// Add 'filterable' class to every filterable table
			this.$element.addClass('filterable');

			this.popovers = [];
			
			// Init Bootstrap popover for each heading
			this.$element.find('tr:first')
				.first()
				.children('td,th')
				.each($.proxy(function(index, heading)
				{
					// Se la colonna è filtrabile...
					if(!this.ignoredColumn(index)){
						
						var popoverToggle;
						
						// Se è stato impostato un selettore per la testata della colonna...
						if($.fn.filterableUtils.notNull(this.options.popoverSelector)){
							
							// Elemento su cui cliccare per aprire il popover
							popoverToggle = $(heading).find(this.options.popoverSelector);
						}
						// Altrimenti...
						else{
							
							// No toggle element defined, wrap heading content for use as toggle
							popoverToggle =  $(heading).wrapInner('<div />')
								.children()
								.first();
							
							// Copy any data-* attributes to new <div>
							$(popoverToggle).data($(heading).data());
						}
						
						// Assegna il metodo onFilter all'bottone che innesca il filtro
						this.options.onFilter = $.proxy(this.onFilter, this);
						
						// Inizializza l'oggetto FilterablePopover
						$(popoverToggle).attr('data-toggle', 'popover')
							.filterablePopover(this.options);
						
						// Aggiunge l'oggetto FilterablePopover all'array popovers
						this.popovers.push($(popoverToggle).data('filterablePopover'));
						
						// Imposta il valore di index in popover
						this.popovers[index].index(index);
						
						// Esegue all'apertura del popover
						$(popoverToggle).on('show.bs.popover', $.proxy(function()
						{
							// Assegna la lista dei termini per il plugin autocomplete
							this.popovers[index].lookup(this.autocompleteValues(index));
						}, this));
						
						// If there is an initial filter, go ahead and filter
						var filterHash = this.filterHash(index);
						var initialFilter = $.bbq.getState(filterHash) || '';
						if(initialFilter !== ''){

							// Imposta il valore del campo di ricerca con il valore di query
							this.popovers[index].input(initialFilter);
							
							// Assegna la classe css active all'elemento toggle del popover
							$(popoverToggle).addClass('filterable-active');
							
							// Filtra passando la query (initialFilter) 
							// e il numero della colonna da filtrare (index)
							this.filter(initialFilter, index);
						}
					} 
					// Altrimenti...
					else{
						
						this.popovers.push(null);
					}
				}, this));
			
			// Close popovers on click ouside
			$('body').on('click.filterable', $.proxy(function(e)
			{
				this.closePopovers(e);
			}, this));
			
			// Bind an event to window.onhashchange that, 
			// when the history state changes,
			// iterates over all popover, 
			// getting their appropriate url from the
			// current state.
			$(window).bind('hashchange.filterable', $.proxy(function(e)
			{
				$.each(this.popovers, $.proxy(function(popoverIndex, popover)
				{
					if($.fn.filterableUtils.notNull(popover)){
						
						this.hashChange(popover, popoverIndex);
					}
				}, this));
			}, this));

			// Finilize init
			$.proxy(function()
			{
				/**
				Fired when element was initialized by `$().filterable()` method.
				Please note that you should setup `init` handler **before** applying `filterable`.
							  
				@event init
				@param {Object} event event object
				@param {Object} editable filterable instance (as here it cannot accessed via data('editable'))
				**/
				this.$element.triggerHandler('init', this);
			}, this);
		},

		/**
		Removes filterable feature from element
		@method destroy()
		**/
		destroy: function()
		{
			this.$element.removeClass('filterable');
			this.$element.removeData('filterable');
		}
	};

	// Initilize each filterable table
	$.fn.filterable = function(option)
	{
		// Special API methods returning non-jquery object
		var args = arguments, 
			datakey = 'filterable';

		// Return jquery object
		return this.each(function()
		{
			var $this = $(this), // tabella
				id = $this.attr('id'), // table ID
				data = $this.data(datakey), // oggetto Filterable
				options = typeof option === 'object' && option; // opzioni
			
			// Se l'oggetto Filterable non è stato inizializzato...
			if(!data){
				
				// Inizializza l'oggetto Filterable e lo assegna alla tabella
				$this.data(datakey, (data = new Filterable(this, options)));
			}
			
			// Se opzione è una stringa...
			if(typeof option === 'string'){
				
				// Chiama un metodo dell'oggetto Filterable
				data[option].apply(data, Array.prototype.slice.call(args, 1));
			}
		});
	};
	
	// Default options
	$.fn.filterable.defaults = {
		
		/**
		Column indexes to not make filterable
		@property ignoreColumns
		@type array
		@default []
		**/
		ignoreColumns: [],
	
		/**
		Column indexes to make filterable, all other columns are left non-filterable.
		**Note**: This takes presidence over <code>ignoreColumns</code> when both are provided.
		@property onlyColumns
		@type array
		@default null
		**/
		onlyColumns: null,
	
		/**
		Sets case sensitivity
		@property ignoreCase
		@type boolean
		@default true
		**/
		ignoreCase: true,
	
		/**
		Selector to use when making the popover toggle
		@property popoverSelector
		@type string
		@default null
		**/
		popoverSelector: null,
	
		/**
		Function called before filtering is done.
		@property beforeFilter(element, cellIndex, query)
		@default null
		@example
		beforeFilter: function(element, cellIndex, query) {
		  // Manipulate DOM here
		}
		**/
		beforeFilter: null,
	
		/**
		Function called after filtering is done.
		@property afterFilter(element, cellIndex, query)
		@default null
		@example
		afterFilter: function(element, cellIndex, query) {
		  // Manipulate DOM here
		}
		**/
		afterFilter: null
	};
})(jQuery);

/**
 * FilterablePopover
 */
(function($){
	"use strict";
	
	// Costruttore
	var FilterablePopover = function(heading, options)
	{
		this.$heading = $(heading); // jquery heading cell or icon
		this.index; // heading index
		this.value; // input value
		
		// Oggetto opzioni
		this.options = $.extend({}, $.fn.filterable.defaults, options);
		
		// Chiama il metodo init
		this.init();
	};
	
	FilterablePopover.prototype = {
		
		/**
		Metodo costruttore
		@method constructor()
		**/
		constructor: FilterablePopover,
		
		/**
		Ritorna o imposta il numero della colonna
		@method index()
		**/
		index: function(index)
		{
			if($.fn.filterableUtils.isNull(index)){
				
				return this.index;
			} else{
				
				this.index = index;
			}
		},
		
		/**
		Ritorna o imposta il campo input
		@method input()
		**/
		input: function(value)
		{
			if($.fn.filterableUtils.isNull(value)){
				
				return this.$content.find('.filter-input');
			} else{
				
				this.value = value;
			}
		},
		
		/**
		Imposta i contenuti delle celle su cui effettuare la ricerca
		@method lookup()
		**/
		lookup: function(values)
		{
			this.$content.find('.filter-input')
				.filterableAutocomplete('lookup', values);
		},
		
		/**
		Inizializza il filtro
		@method init()
		**/
		init: function()
		{
			// Add 'filterable-popover' class to every heading element
			this.$heading.addClass('filterable-popover');
			
			// Template popover
			var tplPopover = '<div class="popover" role="tooltip">'
				+ '<div class="arrow"></div>'
				+ '<h3 class="popover-header d-flex align-items-center"></h3>'
				+ '<div class="popover-body"></div>'
				+ '</div>';
			
			// Contenuto del Body di popover
			var content = '<form>'
				+ '<div class="input-group">'
				+ '<input type="search" class="form-control form-control-sm filter-input">'
				+ '<div class="input-group-append">'
				+ '<button class="btn btn-primary btn-sm filter-btn"><span class="fa fa-check"></span></button>'
				+ '<button class="btn btn-danger btn-sm empty-input"><span class="fa fa-times"></span></button>'
				+ '</div>'
				+ '<div class="position-relative flex-fill w-100 autocomplete-container"></div>'
				+ '</div>'
				+ '</form>';
			
			// Crea l'elemento contenuto
			this.$content = $(content);
			
			// Empty input
			this.$content.find('.empty-input')
				.on('click', $.proxy(function(e)
				{
					e.preventDefault();
					
					// Svuota il campo input
					this.$content.find('.filter-input')
						.val('');
					
					// Esegue il filtro
					this.$content.find('.filter-btn')
						.trigger('click.filterable');
				}, this));
			
			// Filter button
			this.$content.find('.filter-btn')
				.on('click.filterable', $.proxy(function(e)
				{
					e.preventDefault();
					
					// Se esiste una funzione onFilter...
					if(typeof this.options.onFilter === 'function'){
						
						// Esegue la funzione passando heading e valore del campo input
						this.options.onFilter(this.$heading, this.$content.find('.filter-input').val(), this.index);
					}
				}, this));
			
			// Custom jQuery to hide popover on click of the close button
			$(document).on('click.filterable', '.popover-header .close-popover', function(e)
			{
				e.preventDefault();
				
				// Elimina il popover
				$(this).parents('.popover')
					.popover('hide');
			});
			
			// Inizializza l'oggetto FilterableAutocomplete
			this.$content.find('.filter-input')
				.filterableAutocomplete(this.options);
			
			var title = this.$heading.data('ftTitle') != ''? this.$heading.data('ftTitle') 
					+ '<span class="fa fa-times ml-auto close-popover" role="button"></span>':
					'';
			
			// Inizializza Bootstrap popover
			this.$heading.popover($.extend({
				container: 'body',
				title: title,
				content: this.$content,
				sanitize: false,
				html: true,
				template: tplPopover,
				placement: 'top',
				customClass: 'filterable-popover'
			}, this.options.popoverOptions));
			
			// Evento shown popover
			this.$heading.on('shown.bs.popover', $.proxy(function()
			{
				// Imposta un valore nel campo di ricerca
				// e mette il focus sul campo
				this.$content.find('.filter-input')
					.val(this.value)
					.focus();
			}, this));
			
			// Evento show popover
			this.$heading.on('show.bs.popover', $.proxy(function()
			{
				this.$heading.addClass('filterable-popover-click');
			}, this));
			
			// Evento hide popover
			this.$heading.on('hide.bs.popover', $.proxy(function()
			{
				this.$heading.removeClass('filterable-popover-click');
			}, this));

			// Finilize init
			$.proxy(function()
			{
				/**
				Fired when element was initialized by `$().filterable()` method.
				Please note that you should setup `init` handler **before** applying `filterable`.
							  
				@event init
				@param {Object} event event object
				@param {Object} editable filterable instance (as here it cannot accessed via data('editable'))
				**/
				this.$heading.triggerHandler('init', this);
			}, this);
		},

		/**
		Removes filterablePopover feature from heading
		@method destroy()
		**/
		destroy: function()
		{
			this.$heading.removeClass('filterable-popover filterable-popover-click');
			this.$heading.removeData('filterablePopover');
		}
	}
		
	// Initilize each filterable table
	$.fn.filterablePopover = function(option)
	{
		// Special API methods returning non-jquery object
		var args = arguments, 
			datakey = 'filterablePopover';
    
		// Return jquery object
		return this.each(function()
		{
			var $this = $(this), // riga
				data = $this.data(datakey), // oggetto FilterablePopover
				options = typeof option === 'object' && option; // opzioni
			
			// Se l'oggetto FilterablePopover non è stato inizializzato...
			if(!data){
				
				// Inizializza l'oggetto FilterablePopover e lo assegna alla tabella
				$this.data(datakey, (data = new FilterablePopover(this, options)));
			}
			
			// Se opzione è una stringa...
			if(typeof option === 'string'){
				
				// Chiama un metodo dell'oggetto FilterablePopover
				data[option].apply(data, Array.prototype.slice.call(args, 1));
			}
		});
	};
	
	// Default options
	$.fn.filterablePopover.defaults = {
		
		/**
		Function called for filtering column.
		@property onFilter(popoverToggle, query, cellIndex)
		@default null
		@example
		onFilter: function(popoverToggle, query, cellIndex) {
		  // Execute filtering
		}
		**/
		onFilter: null,
		
		/**
		Additional options for popover plugin
		@property popoverOptions
		@type object
		@default null
		**/
		popoverOptions: null
	};
})(jQuery);

/**
 * FilterableAutocomplete
 */
(function($){
	"use strict";
	
	// Costruttore
	var FilterableAutocomplete = function(input, options)
	{
		this.$input = $(input); // jquery input
		
		// Oggetto opzioni
		this.options = $.extend({}, $.fn.filterable.defaults, options);
		
		// Chiama il metodo init
		this.init();
	};
	
	FilterableAutocomplete.prototype = {
		
		/**
		Metodo costruttore
		@method constructor()
		**/
		constructor: FilterableAutocomplete,
		
		/**
		Array su cui effettuare la ricerca
		@method lookup()
		**/
		lookup: function(values)
		{
			this.$input.autocomplete('setOptions', { 'lookup': values });
		},
		
		/**
		Inizializza il filtro
		@method init()
		**/
		init: function()
		{
			// Add 'filterable-autocomplete' class to every input element
			this.$input.addClass('filterable-autocomplete');
			
			// Inizializza autocomplete plugin
			this.$input.autocomplete($.extend({
				lookup: [],
				appendTo: this.$input.siblings('.autocomplete-container')
			}, this.options.autocompleteOptions));

			// Finilize init
			$.proxy(function()
			{
				/**
				Fired when element was initialized by `$().filterable()` method.
				Please note that you should setup `init` handler **before** applying `filterable`.
							  
				@event init
				@param {Object} event event object
				@param {Object} editable filterable instance (as here it cannot accessed via data('editable'))
				**/
				this.$input.triggerHandler('init', this);
			}, this);
		},

		/**
		Removes filterableAutocomplete feature from input
		@method destroy()
		**/
		destroy: function()
		{
			this.$input.removeClass('filterable-autocomplete');
			this.$input.removeData('filterableAutocomplete');
		}
	}
		
	// Initilize each filterable table
	$.fn.filterableAutocomplete = function(option)
	{
		// Special API methods returning non-jquery object
		var args = arguments, 
			datakey = 'filterableAutocomplete';
    
		// Return jquery object
		return this.each(function()
		{
			var $this = $(this), // riga
				data = $this.data(datakey), // oggetto FilterableAutocomplete
				options = typeof option === 'object' && option; // opzioni
			
			// Se l'oggetto FilterableAutocomplete non è stato inizializzato...
			if(!data){
				
				// Inizializza l'oggetto FilterableAutocomplete e lo assegna alla tabella
				$this.data(datakey, (data = new FilterableAutocomplete(this, options)));
			}
			
			// Se opzione è una stringa...
			if(typeof option === 'string'){
				
				// Chiama un metodo dell'oggetto FilterableAutocomplete
				data[option].apply(data, Array.prototype.slice.call(args, 1));
			}
		});
	};
	
	// Default options
	$.fn.filterableAutocomplete.defaults = {
		
		/**
		Additional options for autocomplete plugin
		@property autocompleteOptions
		@type object
		@default null
		**/
		autocompleteOptions: {},
	};
})(jQuery);
