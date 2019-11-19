const PERF = 100000 // base performance unit as max milliseconds

let state = JSON.parse(localStorage.getItem('jupiter')) || {
  integrations: {},
  jobs: {},
  tab: 0,
}
state.name = state.name || prompt('Please enter your name that others can see in Zeus', '')
document.querySelectorAll('#Zeus-Head a:last-child').forEach(el => el.innerHTML += state.name)

function stateChanged() {
  localStorage.setItem('jupiter', JSON.stringify(state))
  render()
}

function render() {
  gridOptions_Jobs.api.setRowData(getJobs())
  gridOptions_Activity.api.setRowData(getJobs())
}

function getFiles() {
  let files = []
  const numFiles = 5 /*Math.ceil(Math.random() * 5)*/ // up to 5 files
  for (let i = 0; i < numFiles; i++) {
    let file = {}
    file.lander = 'lander_1234…'
    file.name = cuid()
    file.landed = (Math.random() > 0.2)
    files.push(file)
  }
  console.log(files)
  return files
}

function getJobs() {
  return Object.values(state.jobs).reverse()
}

function getQualityStatus() {
  return (Math.random() < 0.5) ? 'All quality checks passed' : 'Quality checks failed'
}

// function makeIntegration() {
//   return {
//     'hooli_vendo_eligibility'
//   }
// }

function runJob() {
  let job = {}
  job.created = Date.now()
  job.by = state.name
  job.id = parseInt(job.created.toString().substr(-6))
  job.eta = (getJobs().length < 1) ? 'No prior jobs' : Math.floor(job.created + (Math.random() * (PERF * 2)))
  // job.files = getFiles()
  job.integration = 'hooli_vendo_eligibility'
  job.status = 'Running job on Databricks…'
  state.jobs[job.id] = job
  stateChanged()
  simulateJobStatus(job.id)
}

function simulateJobStatus(jobId) {
  setTimeout(() => {
    state.jobs[jobId].status = 'Running quality checks…'
    stateChanged()
    setTimeout(() => {
      state.jobs[jobId].status = getQualityStatus()
      stateChanged()
    }, Math.random() * PERF)
  }, Math.random() * PERF)
}

const gridOptions_Jobs = {
  defaultColDef: {
    enableRowGroup: true,
    enablePivot: true,
    filter: 'agTextColumnFilter',
    resizable: true,
    sortable: true,
  },
  // domLayout: 'autoHeight',
  floatingFilter: true,
  columnDefs: [
    {headerName: 'Created', field: 'created', valueFormatter: formatTime},
    {headerName: 'By', field: 'by'},
    {headerName: 'Job Id', field: 'id', cellRenderer: linkToDatabricks},
    {headerName: 'Integration', field: 'integration'},
    {headerName: 'ETA', field: 'eta', valueFormatter: formatETA},
    {
      headerName: 'Status',
      field: 'status',
      cellClassRules: {
        'fail': (params) => params.value.includes('fail'),
      }
    },
    {headerName: 'Actions', cellRenderer: () => '<a class="far fa-eye" href="#"></a>'}
  ],
  rowData: getJobs(),
  onFirstDataRendered: (params) => params.api.sizeColumnsToFit(),
  onGridReady: autoSizeJobs,
}
new agGrid.Grid(document.querySelector('#Zeus-Jobs'), gridOptions_Jobs)

const gridOptions_Activity = {
  defaultColDef: {
    enableRowGroup: true,
    enablePivot: true,
    filter: 'agTextColumnFilter',
    resizable: true,
    sortable: true,
  },
  // domLayout: 'autoHeight',
  floatingFilter: true,
  columnDefs: [
    {headerName: 'Created', field: 'created', valueFormatter: formatTime},
    {headerName: 'Job Id', field: 'id', cellRenderer: linkToDatabricks},
    {headerName: 'ETA', field: 'eta', valueFormatter: formatETA},
    {
      headerName: 'Status',
      field: 'status',
      cellClassRules: {
        'fail': (params) => params.value.includes('fail'),
      }
    },
    {headerName: 'Actions', cellRenderer: () => '<a class="far fa-eye" href="#"></a>'}
  ],
  rowData: getJobs(),
  onFirstDataRendered: (params) => params.api.sizeColumnsToFit(),
  onGridReady: autoSizeActivity,
}
new agGrid.Grid(document.querySelector('#Zeus-Activity'), gridOptions_Activity)

const gridOptions_Files = {
  defaultColDef: {
    enableRowGroup: true,
    enablePivot: true,
    filter: 'agTextColumnFilter',
    resizable: true,
    sortable: true,
  },
  domLayout: 'autoHeight',
  floatingFilter: true,
  columnDefs: [
    {headerName: 'Lander', field: 'lander'},
    {headerName: 'Filename', field: 'name'},
    {headerName: 'Landed', field: 'landed'},
    {headerName: 'Actions', cellRenderer: () => '<a class="far fa-eye" href="#"></a>'}
  ],
  rowClassRules: {
    'fail': (params) => !params.data.landed
  },
  rowData: getFiles(),
  onFirstDataRendered: (params) => params.api.sizeColumnsToFit(),
  onGridReady: autoSizeActivity,
}
new agGrid.Grid(document.querySelector('#Zeus-Files'), gridOptions_Files)

function linkToDatabricks(params) {
  return '<a href="#" title="View on Databricks">'+ params.value +'</a>'
}

function formatTime(params) {
  return moment(params.value).fromNow()
}

function formatETA(params) {
  const val = params.value
  return typeof val === 'string' ? val : moment(val).fromNow() +' · '+ moment(val).format('LT')
}

function autoSizeJobs() {
  let allColumnIds = []
  gridOptions_Jobs.columnApi.getAllColumns().forEach((column) => {
      allColumnIds.push(column.colId)
  })
  gridOptions_Jobs.columnApi.autoSizeColumns(allColumnIds)
}

function autoSizeActivity() {
  let allColumnIds = []
  gridOptions_Activity.columnApi.getAllColumns().forEach((column) => {
      allColumnIds.push(column.colId)
  })
  gridOptions_Activity.columnApi.autoSizeColumns(allColumnIds)
}

// document.addEventListener('DOMContentLoaded', () => {})
document.getElementById('Zeus-Run-Integration').addEventListener('click', (e) => {
  runJob()
})

document.querySelectorAll('.Section-Head').forEach(el =>
  el.addEventListener('click', (e) => el.parentElement.classList.toggle('expand')))

render()

document.addEventListener('keydown', (e) => {
  // console.log(e.which)
  if (e.which === 49) {
    document.getElementById('Zeus-Run-Integration').dispatchEvent(new Event('click'))
  }
  if (e.which === 48) {
    state.jobs = {}
    stateChanged()
  }
})