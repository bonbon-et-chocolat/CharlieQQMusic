function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  }
  
function getComparator(order, orderBy) {
    return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}


function stableSort(array, comparator) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
}

const defaultOptions = {
  method: 'GET',
  headers: {
      'Content-Type': 'application/json'
  }
};

async function genericRequest( url, options = defaultOptions ) {
  const oResponse = await fetch( url, options );
  let oData = {};
  try {
      oData = await oResponse.json();
  } catch( err ) {
      throw new Error( 'error' );
  }
  if( oResponse.status >= 400 ) {
      throw new Error( 'request failed' );
  } else {
      return oData;
  }
}

export {
    descendingComparator,
    getComparator,
    stableSort,
    genericRequest
}