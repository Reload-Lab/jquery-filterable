/*!
 * jQuery filterable Plugin
 * https://github.com/Reload-Lab/jquery-filterable
 *
 * @updated September 22, 2023
 * @version 1.0.1
 *
 * @author Domenico Gigante <domenico.gigante@reloadlab.it>
 * @copyright (c) 2023 Reload Laboratorio Multimediale <info@reloadlab.it> (https://www.reloadlab.it)
 * @license MIT
 */
 
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
		this.match = null; // proprietà valorizzata su true o false a seconda che la cella corrisponda o meno alla query
		
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
		Imposta le classi css match e mismatch
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
				this.$cell.triggerHandler('init', this);
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
			var $this = $(this), // jquery cella
				data = $this.data(datakey), // oggetto FilterableCell
				options = typeof option === 'object' && option; // opzioni
			
			// Se l'oggetto FilterableCell non è stato inizializzato...
			if(!data && typeof options === 'object'){
				
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
		this.cells = []; // array oggetti FilterableCell
		
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
		Ritorna una cella della riga in base al numero di colonna (colIndex)
		@method cell()
		**/
		cell: function(colIndex)
		{
			return this.cells[colIndex];
		},

		/**
		Imposta le classi css match e mismatch
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
		e il numero della cella da filtrare (colIndex)
		@method filter()
		**/
		filter: function(query, colIndex)
		{
			this.cells[colIndex].isMatch(query);
			this.setMatch(!this.hasMismatch());
		},
    	
		/**
		Esclude le colonne da non filtrare
		@method ignoredColumn()
		**/
		ignoredColumn: function(colIndex)
		{
			// Se l'opzione 'onlyColumns' è valorizzata...
			if($.fn.filterableUtils.notNull(this.options.onlyColumns)){
				
				// Ritorno true se la colonna non è tra quelle da filtrare
				// Altrimenti ritorno false
				return $.inArray(colIndex, this.options.onlyColumns) === -1;
			}
			
			// Ritorno true se la colonna è tra quelle da ignorare
			// Altrimenti ritorno false
			return $.inArray(colIndex, this.options.ignoreColumns) !== -1;
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
				.each($.proxy(function(colIndex, cell)
				{
					// Se la cella è filtrabile...
					if(!this.ignoredColumn(colIndex)){
						
						// Inizializza l'oggetto FilterableCell
						$(cell).filterableCell(this.options);
						
						// Aggiunge l'oggetto FilterableCell all'array cells
						this.cells.push($(cell).data('filterableCell'));
					} 
					// Altrimenti...
					else{
						
						// Aggiunge l'oggetto FilterableCell all'array cells
						this.cells.push(null);
					}
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
			var $this = $(this), // jquery riga
				data = $this.data(datakey), // oggetto FilterableRow
				options = typeof option === 'object' && option; // opzioni
			
			// Se l'oggetto FilterableRow non è stato inizializzato...
			if(!data && typeof options === 'object'){
				
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
	var Filterable = function(table, options)
	{
		this.$table = $(table); // jquery tabella
		this.rows = null; // array oggetti FilterableRow
		this.popovers = null; // array oggetti FilterablePopover
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
		ignoredColumn: function(colIndex)
		{
			// Se l'opzione 'onlyColumns' è valorizzata...
			if($.fn.filterableUtils.notNull(this.options.onlyColumns)){
				
				// Ritorno true se la colonna non è tra quelle da filtrare
				// Altrimenti ritorno false
				return $.inArray(colIndex, this.options.onlyColumns) === -1;
			}
			
			// Ritorno true se la colonna è tra quelle da ignorare
			// Altrimenti ritorno false
			return $.inArray(colIndex, this.options.ignoreColumns) !== -1;
		},

		/**
		Ritorna la variabile della query string
		@method filterHash()
		**/
		filterHash: function(colIndex)
		{
			// Attributo ID della tabella
			var tableId = this.$table.attr('id');
			
			// Se presente l'attributo ID...
			if(tableId != ''){
				
				// Ritorna l'hash-var della colonna della tabella
				return 'filter_' + tableId + '_' + colIndex;
			}
			
			// Ritorna l'hash-var della colonna senza identificativo della tabella
			return 'filter_' + '_' + colIndex;
		},

		/**
		Raccoglie tutte le righe nell'array rows
		@method initRows()
		**/
		initRows: function()
		{
			this.rows = [];
			
			// Cicla tutti i TR, esclusa la prima riga 
			this.$table.children('tbody,*')
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
		Genera l'array dei valori da passare al plugin Autocomplete
		@method autocompleteValues()
		**/
		autocompleteValues: function(colIndex)
		{
			var keys = {};
			
			// Se le righe non sono state ancora raccolte nell'array rows...
			if($.fn.filterableUtils.isNull(this.rows)){
				
				// Raccoglie tutte le righe nell'array rows
				this.initRows();
			}
			
			// Cicla tutte le righe 
			$.each(this.rows, $.proxy(function(rowIndex, row)
			{
				// Include solo le righe che hanno qualche corrispondenza con una query
				if(!row.hasMismatch()){
					
					// Assegna una proprietà all'oggetto keys
					// In questo modo evita i doppioni
					keys[row.cell(colIndex).value()] = '';
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
		e il numero della colonna da filtrare (colIndex)
		@method filter()
		**/
		filter: function(query, colIndex)
		{
			// Se esiste la funzione beforeFilter...
			if(typeof this.options.beforeFilter === 'function'){
				
				// Esegue la funzione beforeFilter
				this.options.beforeFilter(this.$table, colIndex, query);
			}
			
			// Se le righe non sono state ancora raccolte nell'array rows...
			if($.fn.filterableUtils.isNull(this.rows)){
				
				// Raccoglie tutte le righe nell'array rows
				this.initRows();
			}

			// Cicla tutte le righe 
			$.each(this.rows, $.proxy(function(rowIndex, row)
			{
				// Su ogni riga esegue il filtro sulla cella sotto esame
				row.filter(query, colIndex);
			}, this));
			
			// Inserisce la query nell'oggetto queries
			this.queries[colIndex] = query;
			
			// Se esiste la funzione afterFilter...
			if(typeof this.options.afterFilter === 'function'){
				
				// Esegue la funzione afterFilter
				this.options.afterFilter(this.$table, colIndex, query);
			}
		},

		/**
		Funzione collegata all'evento onFilter
		@method onFilter()
		**/
		onFilter: function(popoverToggle, query, colIndex)
		{
			var state = {};
			
			// Se il campo input è vuoto...
			if(query === ''){
				
				// Remove the state
				if(this.options.useHash === true){
					
					$.bbq.removeState(this.filterHash(colIndex));
				}
				
				// Rimuove la classe css 'filterable-active'
				$(popoverToggle).removeClass('filterable-active');
			} 
			// Altrimenti...
			else{
				
				// Set the state
				if(this.options.useHash === true){
					
					state[this.filterHash(colIndex)] = query;
					$.bbq.pushState(state);
				}
				
				// Aggiunge la classe 'filterable-active'
				$(popoverToggle).addClass('filterable-active');
			}
		
			// Elimina il popover
			$(popoverToggle).popover('hide');

			// Salva l'ultimo valore input con il valore query
			this.popovers[colIndex].input(query);
			
			// Filtra passando la query (params.newValue) 
			// e il numero della colonna da filtrare (colIndex)
			this.filter(query, colIndex);
		},

		/**
		La funzione chiude tutti i filterablePopover aperti 
		(in genere uno solo alla volta)
		@method closePopovers()
		**/
		closePopovers: function(e)
		{
			// Cicla tutti i filterablePopover
			$('[data-toggle="popover"]').each(function()
			{
				// Hide any open filterablePopover when the anywhere else in the body is clicked
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
		hashChange: function(popover, colIndex)
		{
			var filterHash = this.filterHash(colIndex),
				query = $.bbq.getState(filterHash) || '';
				
			// Imposta il valore del campo di ricerca con il valore di query
			popover.input(query);
			
			// Se query non è una stringa vuota...
			if(query !== ''){
				
				// Assegna la classe css 'filterable-active' al toggler del filterablePopover
				popover.$toggler.addClass('filterable-active');
			}
			// Altrimenti...
			else{
				
				// Rimuove la classe css 'filterable-active' al toggler del filterablePopover
				popover.$toggler.removeClass('filterable-active');
			}
			
			// Se query è uguale al corrispondente valore in queries
			if(typeof this.queries[colIndex] == 'undefined' 
				|| query == this.queries[colIndex]
			){
				// Non viene eseguito il filtro
				return;	
			}
			
			// Filtra passando la query (query) 
			// e il numero della colonna da filtrare (colIndex)
			this.filter(query, colIndex);
		},

		/**
		Inizializza il filtro
		@method init()
		**/
		init: function()
		{
			// Add 'filterable' class to every filterable table
			this.$table.addClass('filterable');

			this.popovers = [];
			
			// Imposta 'ignoreColumns' e 'onlyColumns' attraverso l'attributo data
			this.$table.find('tr:first')
				.first()
				.children('td,th')
				.each($.proxy(function(colIndex, heading)
				{
					var $th = $(heading);
					
					// Se esiste Ignore...
					if($th.data('ftIgnore')){
						
						if($.inArray(colIndex, this.options.ignoreColumns) === -1){
							
							// Aggiunge l'indice della colonna a quelle da non filtrare
							this.options.ignoreColumns.push(colIndex);
						}
					}
					
					// Se esiste Filter...
					if($th.data('ftFilter')){
						
						// Se 'onlyColumns' è null...
						if($.fn.filterableUtils.isNull(this.options.onlyColumns)){
							
							// Imposta 'onlyColumns' come array
							this.options.onlyColumns = [];
						}
						
						if($.inArray(colIndex, this.options.onlyColumns) === -1){
							
							// Aggiunge l'indice della colonna a quelle da filtrare
							this.options.onlyColumns.push(colIndex);
						}
					}
				}, this));
				
			// Init Bootstrap Popovers for each heading
			this.$table.find('tr:first')
				.first()
				.children('td,th')
				.each($.proxy(function(colIndex, heading)
				{
					// Se la colonna è filtrabile...
					if(!this.ignoredColumn(colIndex)){
						
						var popoverToggle;
						
						// Se è stato impostato un selettore per la testata della colonna...
						if($.fn.filterableUtils.notNull(this.options.popoverSelector)){
							
							// Elemento su cui cliccare per aprire il filterablePopover
							popoverToggle = $(heading).find(this.options.popoverSelector);
						}
						// Altrimenti...
						else{
							
							// No toggle element defined, wrap heading content for use as toggle
							popoverToggle = $(heading).wrapInner('<div />')
								.children()
								.first();
							
							// Copy any data-* attributes to new <div>
							$(popoverToggle).data($(heading).data());
						}
						
						// Assegna il metodo onFilter all'bottone che innesca il filtro
						if(typeof this.options.onFilter === 'function'){
							
							this.options.onFilter = $.proxy(this.options.onFilter, this);
						} else{
							
							this.options.onFilter = $.proxy(this.onFilter, this);
						}
						
						// Inizializza l'oggetto FilterablePopover
						$(popoverToggle).attr('data-toggle', 'popover')
							.filterablePopover(this.options);
						
						// Aggiunge l'oggetto FilterablePopover all'array popovers
						this.popovers.push($(popoverToggle).data('filterablePopover'));
						
						// Imposta il valore di index in filterablePopover
						this.popovers[colIndex].index(colIndex);
						
						// Esegue all'apertura del filterablePopover
						$(popoverToggle).on('show.bs.popover', $.proxy(function()
						{
							// Assegna la lista dei termini per il plugin Autocomplete
							this.popovers[colIndex].lookup(this.autocompleteValues(colIndex));
						}, this));
						
						// If there is an initial filter, go ahead and filter
						if(this.options.useHash === true){
							
							var filterHash = this.filterHash(colIndex);
							var initialQuery = $.bbq.getState(filterHash) || '';
							if(initialQuery !== ''){
	
								// Imposta il valore del campo di ricerca con il valore di query (initialQuery)
								this.popovers[colIndex].input(initialQuery);
								
								// Assegna la classe css 'filterable-active' al toggler del filterablePopover
								$(popoverToggle).addClass('filterable-active');
								
								// Filtra passando la query (initialQuery) 
								// e il numero della colonna da filtrare (colIndex)
								this.filter(initialQuery, colIndex);
							}
						}
					} 
					// Altrimenti...
					else{
						
						this.popovers.push(null);
					}
				}, this));
			
			// Close filterablePopover on click ouside
			$('body').on('click.filterable', $.proxy(function(e)
			{
				this.closePopovers(e);
			}, this));
			
			// Bind an event to window.onhashchange that, 
			// when the history state changes,
			// iterates over all filterablePopover, 
			// getting their appropriate url from the
			// current state.
			$(window).bind('hashchange.filterable', $.proxy(function(e)
			{
				if(this.options.useHash === true){
						
					$.each(this.popovers, $.proxy(function(popoverIndex, popover)
					{
						if($.fn.filterableUtils.notNull(popover)){
							
							this.hashChange(popover, popoverIndex);
						}
					}, this));
				}
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
				this.$table.triggerHandler('init', this);
			}, this);
		},

		/**
		Removes filterable feature from element
		@method destroy()
		**/
		destroy: function()
		{
			this.$table.removeClass('filterable');
			this.$table.removeData('filterable');
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
			var $this = $(this), // jquery tabella
				id = $this.attr('id'), // table ID
				data = $this.data(datakey), // oggetto Filterable
				options = typeof option === 'object' && option; // opzioni
			
			// Se l'oggetto Filterable non è stato inizializzato...
			if(!data && typeof options === 'object'){
				
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
		Selector to use when making the filterablePopover toggler
		@property popoverSelector
		@type string
		@default null
		**/
		popoverSelector: null,
	
		/**
		Use hashchange event and back button
		@property useHash
		@type boolean
		@default true
		**/
		useHash: true,
	
		/**
		Function called before filtering is done.
		@property beforeFilter(element, colIndex, query)
		@default null
		@example
		beforeFilter: function(element, colIndex, query) {
		  // Manipulate DOM here
		}
		**/
		beforeFilter: null,
	
		/**
		Function called after filtering is done.
		@property afterFilter(element, colIndex, query)
		@default null
		@example
		afterFilter: function(element, colIndex, query) {
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
	var FilterablePopover = function(toggler, options)
	{
		this.$toggler = $(toggler); // jquery toggler del filterablePopover
		this.colIndex; // col index
		this.value; // input field value
		
		// Oggetto opzioni
		this.options = $.extend({}, $.fn.filterablePopover.defaults, options);
		
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
		index: function(colIndex)
		{
			// Se colIndex è null...
			if($.fn.filterableUtils.isNull(colIndex)){
				
				// Ritorna l'indice della colonna (0, 1, 2, ecc.)
				// associata al filterablePopover
				return this.colIndex;
			} 
			// Altrimenti...
			else{
				
				// Imposta il valore dell'indice della colonna
				// associata al filterablePopover
				this.colIndex = colIndex;
			}
		},
		
		/**
		Ritorna o imposta il campo input
		@method input()
		**/
		input: function(query)
		{
			// Se query è null...
			if($.fn.filterableUtils.isNull(query)){
				
				// Ritorna il valore del campo input del filterablePopover
				return this.$body.find('.filter-input');
			} 
			// Altrimenti...
			else{
				
				// Imposta il valore con la query associata al filterablePopover
				this.value = query;
			}
		},
		
		/**
		Imposta i contenuti delle celle su cui effettuare la ricerca
		@method lookup()
		**/
		lookup: function(values)
		{
			// Chiama il metodo 'lookup' del plugin Autocomplete
			// e gli passa tutti o parte dei contenuti della colonna
			// per effettuare il suggest 
			this.$body.find('.filter-input')
				.filterableAutocomplete('lookup', values);
		},
		
		/**
		Inizializza il filtro
		@method init()
		**/
		init: function()
		{
			// Add 'filterable-popover' css class to every filterablePopover toggler
			this.$toggler.addClass('filterable-popover');
			
			// Template del filterablePopover
			var tplPopover = this.options.tplPopover;
			
			// Contenuto del Body del filterablePopover
			var body = this.options.bodyPopover;
			
			// Crea l'elemento contenuto
			this.$body = $(body);
			
			// L'evento svuota il campo input e 
			// azzera il filtro per la colonna corrispondente
			this.$body.find('.empty-input')
				.on('click.filterable', $.proxy(function(e)
				{
					e.preventDefault();
					
					// Svuota il campo input
					this.$body.find('.filter-input')
						.val('');
					
					// Esegue la funzione filtro
					this.$body.find('.filter-btn')
						.trigger('click.filterable');
				}, this));
			
			// L'evento esegue la funzione filtro
			this.$body.find('.filter-btn')
				.on('click.filterable', $.proxy(function(e)
				{
					e.preventDefault();
					
					// Se esiste una funzione onFilter...
					if(typeof this.options.onFilter === 'function'){
						
						// Esegue il filtro passando il toggler, 
						// il valore del campo input e l'indice della colonna
						this.options.onFilter(
							this.$toggler, 
							this.$body.find('.filter-input').val(), 
							this.colIndex
						);
					}
				}, this));
			
			// Custom jQuery to hide filterablePopover on click of the close button in header
			$(document).on('click.filterable', '.popover-header .close-popover', function(e)
			{
				e.preventDefault();
				
				// Nasconde il filterablePopover
				$(this).parents('.popover')
					.popover('hide');
			});

			// Inizializza l'oggetto FilterableAutocomplete
			// associato al campo di input del filterablePopover
			this.$body.find('.filter-input')
				.filterableAutocomplete(this.options);
			
			// header title del filterablePopover
			var title = typeof this.$toggler.data('ftTitle') != 'undefined'? 
					this.$toggler.data('ftTitle'): 
					this.$toggler.text();

			// Se title non è vuoto...
			if(title){
				
				// Se esiste un template per il title del filterablePopover...
				if(this.options.titleTpl){
					
					// Prova a sostituire il segnaposto 'field' 
					// con l'intestazione della colonna
					title = this.options.titleTpl.replace('%field%', title);
				}
				
				// Aggiungo il bottone Close all'header del filterablePopover 
				title += '<span class="fa fa-times ml-auto close-popover" role="button"></span>';
			}
			
			// Inizializza Bootstrap Popovers
			this.$toggler.popover($.extend({
				container: 'body',
				title: title,
				content: this.$body,
				sanitize: false,
				html: true,
				template: tplPopover,
				placement: 'top',
				customClass: 'filterable-popover'
			}, this.options.popoverOptions));
			
			// L'evento imposta un valore nel campo di ricerca
			// e mette il focus sul campo
			this.$toggler.on('shown.bs.popover', $.proxy(function()
			{
				this.$body.find('.filter-input')
					.val(this.value) // value
					.focus(); // focus
			}, this));
			
			// L'evento imposta la classe css 'filterable-popover-click'
			// sul toggler del filterablePopover per segnalare visivamente
			// la colonna selezionata
			this.$toggler.on('show.bs.popover', $.proxy(function()
			{
				this.$toggler.addClass('filterable-popover-click');
			}, this));
			
			// L'evento rimuove la classe css 'filterable-popover-click'
			// sul toggler del filterablePopover per segnalare visivamente
			// che la colonna non è più selezionata
			this.$toggler.on('hide.bs.popover', $.proxy(function()
			{
				this.$toggler.removeClass('filterable-popover-click');
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
				this.$toggler.triggerHandler('init', this);
			}, this);
		},

		/**
		Removes filterablePopover feature from toggler
		@method destroy()
		**/
		destroy: function()
		{
			this.$toggler.removeClass('filterable-popover filterable-popover-click');
			this.$toggler.removeData('filterablePopover');
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
			var $this = $(this), // jquery toggler filterablePopover
				data = $this.data(datakey), // oggetto FilterablePopover
				options = typeof option === 'object' && option; // opzioni

			// Se l'oggetto FilterablePopover non è stato inizializzato...
			if(!data && typeof options === 'object'){
				
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
		@property onFilter(popoverToggle, query, colIndex)
		@default null
		@example
		onFilter: function(popoverToggle, query, colIndex) {
		  // Execute filtering
		}
		**/
		onFilter: null,
		
		/**
		Template per il filterablePopover.
		@property tplPopover
		@default html
		**/
		tplPopover: '<div class="popover" role="tooltip">'
			+ '<div class="arrow"></div>'
			+ '<h3 class="popover-header d-flex align-items-center"></h3>'
			+ '<div class="popover-body"></div>'
			+ '</div>',
		
		/**
		Contenuto del Body di filterablePopover
		@property bodyPopover
		@default html
		**/
		bodyPopover: '<form>'
			+ '<div class="input-group">'
			+ '<input type="search" class="form-control form-control-sm filter-input">'
			+ '<div class="input-group-append">'
			+ '<button class="btn btn-primary btn-sm filter-btn"><span class="fa fa-check"></span></button>'
			+ '<button class="btn btn-danger btn-sm empty-input"><span class="fa fa-times"></span></button>'
			+ '</div>'
			+ '<div class="position-relative flex-fill w-100 autocomplete-container"></div>'
			+ '</div>'
			+ '</form>',
		
		/**
		Template per il title del filterablePopover.
		@property titleTpl
		@default null
		@example
		titleTpl: 'Filtra per %field%'
		**/
		titleTpl: null,
		
		/**
		Additional options for Bootstrap Popovers plugin
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
		this.$input = $(input); // jquery input field filterablePopover
		
		// Oggetto opzioni
		this.options = $.extend({}, $.fn.filterableAutocomplete.defaults, options);
		
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
		Imposta in Autocomplete l'array dei valori 
		su cui effettuare la ricerca dei suggerimenti
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
			// Add 'filterable-autocomplete' css class to every input field
			this.$input.addClass('filterable-autocomplete');
			
			// Inizializza il plugin Autocomplete
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
			var $this = $(this), // jquery input
				data = $this.data(datakey), // oggetto FilterableAutocomplete
				options = typeof option === 'object' && option; // opzioni

			// Se l'oggetto FilterableAutocomplete non è stato inizializzato...
			if(!data && typeof options === 'object'){
				
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
