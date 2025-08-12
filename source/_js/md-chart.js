const MdChart = {
  addToggle() {
    const tables = document.querySelectorAll('.table__body--chart');
    const htmlButtonString = `<button class="markdown-table-toggle">Show chart data<i class="material-icons">keyboard_arrow_right</i></button>`;
    tables.forEach(item => {
      item.insertAdjacentHTML('beforebegin', htmlButtonString);
    });
  },
  toggleMdChart() {
    const buttons = document.querySelectorAll('.markdown-table-toggle');
    buttons.forEach(button => {
      button.addEventListener('click', e => {
        e.target.classList.toggle('active');
        const icon = e.target.querySelector('i');
        e.target.classList.contains('active') ? icon.innerHTML = 'keyboard_arrow_down' : icon.innerHTML = 'keyboard_arrow_right';

        const subsequentTable = e.target.nextSibling;
        subsequentTable.classList.toggle('active');
      });
    });
  },
  init() {
    this.addToggle();
    this.toggleMdChart();
  }
};

module.exports = MdChart;