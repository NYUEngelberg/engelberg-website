const List = require('list.js');
const camelCase = require('lodash.camelcase');

/* eslint-disable comma-dangle */
const NewsFilters = {
  searchQueries: {},
  sortOrder: 'asc',
  clearFiltersID: 'clear-filters',
  sessionsName: 'newsSearchQueries',
  targetListId: 'news-list',
  listElement: 'news-list-item', // class
  dateEl: 'news-item-publication-date',
  resultsItems: [],
  options: {
    targetList: undefined, // targetList holds Listjs instance
    allFilters: undefined,
    valueNames: [
      'news-item-title',
      'news-item-short-description',
      'news-item-publication',
      'news-item-type',
      'news-item-center-author',
      { name: 'news-item-publication-date', attr: 'data-timestamp' }
    ]
  },
  createList() {
    this.targetList = new List(this.targetListId, this.options);

    if (sessionStorage[this.sessionsName]) {
      this.matchSearchQueriesToSessions();
    } else {
      this.setSearchQueryDefaults();
    }
  },
  setSearchQueryDefaults() {
    this.clearResultsItems();
    // used to reset sessions and search queries when clearing filters
    // list js will handle filtering text fields
    this.searchQueries = {
      newsItemPublication: 'all', // dropdown
      newsItemType: 'all', // dropdown
      newsItemCenterAuthor: 'all', // dropdown
      sortOrder: 'desc'
    };
  },
  matchSearchQueriesToSessions() {
    this.searchQueries = {
      newsItemPublication: JSON.parse(sessionStorage[this.sessionsName]).newsItemPublication || 'all', // dropdown
      newsItemCenterAuthor: JSON.parse(sessionStorage[this.sessionsName]).newsItemCenterAuthor || 'all', // dropdown
      newsItemType: JSON.parse(sessionStorage[this.sessionsName]).newsItemType || 'all', // dropdown
      sortOrder: 'desc' // keep desc on refresh
    };
    console.log(this.searchQueries);
  },
  sortByDate(sortOrder = 'desc') {
    /* check mobile sort*/
    const dateToggles = document.querySelectorAll('.js-sort');
    this.searchQueries.sortOrder = sortOrder;
    this.targetList.sort(this.dateEl, { order: sortOrder });

    if (sortOrder === 'desc') {
      dateToggles.forEach(dateToggle => {
        dateToggle.classList.add('button__sort--descending');
        dateToggle.classList.remove('button__sort--ascending');
      });
    } else {
      dateToggles.forEach(dateToggle => {
        dateToggle.classList.add('button__sort--ascending');
        dateToggle.classList.remove('button__sort--descending');
      });
    }

    this.setSessions();
  },
  handleDateSortClick() {
    const dateToggles = document.querySelectorAll('.js-sort');
    dateToggles.forEach(dateToggle => {
      dateToggle.addEventListener('click', () => {
        if (this.searchQueries.sortOrder === 'desc') {
          this.sortByDate('asc');
        } else {
          this.sortByDate('desc');
        }
      });
    });
  },
  // select and checkbox
  filterByDropdownsAndCheckboxes() {
    /**
     * Dropdown filter tag ids: 'news-item-publication', 'news-item-type', 'news-item-center-author'
     */
    // camelcase dropdown filter ids (not dropdown el)
    const { newsItemPublication, newsItemType, newsItemCenterAuthor } = this.searchQueries;

    this.targetList.filter(
      item =>
        // dropdown filter ids using kebabcase
        item
          .values()
          ['news-item-publication'].split(' ')
          .indexOf(newsItemPublication) !== -1 &&
        item
          .values()
          ['news-item-type'].split(' ')
          .indexOf(newsItemType) !== -1 &&
        item
          .values()
          ['news-item-center-author'].split(' ')
          .indexOf(newsItemCenterAuthor) !== -1
    );
    this.setSessions();
  },
  handleDropdownChange() {
    const allDropdowns = document.querySelectorAll('.dropdown');
    allDropdowns.forEach(dropdown => {
      dropdown.addEventListener('change', e => {
        this.updateActiveSearchQueries();
        this.setSessions();
      });
    });
  },
  setSessions() {
    sessionStorage.setItem(this.sessionsName, JSON.stringify(this.searchQueries));
  },
  getActiveDropdowns() {
    document.querySelectorAll('.dropdown').forEach(dropdown => {
      this.searchQueries[camelCase(dropdown.id)] = dropdown[dropdown.selectedIndex].value;
    });
  },
  updateActiveSearchQueries() {
    this.getActiveDropdowns();
    this.filterList();
    this.setSessions();
  },
  filterList() {
    this.clearResultsItems();
    /**
     * Dropdown filter tag ids: 'news-item-publication', 'news-item-type', news-item-center-author
     */
    this.filterByDropdownsAndCheckboxes();
    this.displayResultsCount();
    this.displayResultQueries();
  },
  clearFormInputs() {
    document.querySelectorAll('.dropdown').forEach(dropdown => {
      dropdown.selectedIndex = 0;
    });
  },
  clearAllFilters() {
    this.clearResultsItems();
    this.setSearchQueryDefaults();
    this.targetList.filter();
    this.clearFormInputs();
    this.sortByDate('desc');
    this.displayResultsCount();
    this.displayResultQueries();
    this.setSessions();
  },
  handleClearAllFilters() {
    // done
    document.getElementById(`clear-filters`).addEventListener('click', () => {
      this.clearAllFilters();
    });
  },
  // DISPLAY RESULTS
  getDropdownResultsQuery() {
    Array.from(document.querySelectorAll('.dropdown')).map(item => {
      if (item.options.selectedIndex !== 0) {
        this.resultsItems.push(document.querySelector(`option#${item.value}`).innerText);
      }
      return this.resultsItems;
    });
  },
  displayResultsCount() {
    const count = this.targetList.matchingItems.length;
    const label = count === 1 ? 'result' : 'results';
    document.getElementById('results-total').innerHTML = `Displaying ${count} ${label} `;
  },
  displayResultQueries() {
    // populates this.resultsItems
    this.getDropdownResultsQuery();

    if (this.resultsItems.length > 0) {
      const updateItems = document.querySelectorAll(`.${this.listElement}`);
      const resultsMessage = document.querySelector('#results-filter-detail');
      resultsMessage.classList.add('js-show');
      if (updateItems.length === 0) {
        resultsMessage.innerHTML = `${this.resultsItems.join('; ')}`;
      } else {
        resultsMessage.innerHTML = `for ${this.resultsItems.join('; ')}`;
      }
    } else {
      document.querySelector('#results-filter-detail').classList.remove('js-show');
    }
  },
  clearResultsItems() {
    this.resultsItems = [];
  },
  clearFormInputs() {
    document.querySelectorAll('.dropdown').forEach(dropdown => {
      dropdown.selectedIndex = 0;
    });
  },
  handleSearchBehavior() {
    this.filterList();
  },
  init() {
    this.createList();
    this.sortByDate();
    this.handleDateSortClick();
    this.handleDropdownChange();
    this.handleClearAllFilters();
    this.handleSearchBehavior();
  }
};

module.exports = NewsFilters;