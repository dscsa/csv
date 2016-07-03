function flat2nested(obj) {
  var res = {}

  for (var path in obj) {
    arr  = path.split('.')
    curr = res
    for (var i in arr) {
      var key = arr[i]
      if (i < arr.length-1) {
        curr = curr[key] = curr[key] || {}; continue
      }

      if (typeof obj[path] == 'string')
        obj[path] = obj[path].trim()

      curr[key] = obj[path] || null
    }
  }

  return res
}

var nested2flat = function(obj) {

	var flat = {}

	for (var i in obj) {

		if (obj[i] === null || typeof obj[i] != 'object') {
      flat[i]  = obj[i]; continue
    }

		var flatObject = nested2flat(obj[i])
    var delimited  = i && ! Array.isArray(obj)
		for (var j in flatObject) {

      key = delimited ? i + '.' + j : j

			flat[key]
        ? flat[key] += ';'+flatObject[j]
        : flat[key]  = flatObject[j]
    }
	}

  return flat
}

function parse(file, rows) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header:true,
      dynamicTyping:true,
      preview:rows,
      complete:function(results, file) {
        resolve(results)
      }
    })
  })
}

window.Csv = function(requiredFields, optionalFields) {
  this.requiredFields = requiredFields
  this.optionalFields = optionalFields
}

Csv.prototype.parse = function(file) {
  return parse(file, 1).then(results => {
    var fields = this.requiredFields.concat(this.optionalFields)
    for (var i in fields)
      if (! ~ results.meta.fields.indexOf(fields[i]))
        throw 'CSV must contain the following headers '+fields
  }).then(_ => {
    return parse(file)
  }).then(results => {
    for (var i in results.data) {
      for (var j in this.requiredFields) {
        if ( ! results.data[i][this.requiredFields[j]])
          throw 'CSV missing require value '+this.requiredFields[j]+' on line '+i
      }

      results.data[i] = flat2nested(results.data[i])
    }
    return results.data.reverse()
  })
}

Csv.prototype.unparse = function(name, arr) {
  //Flatten object
  //TODO some sort of check for all required and optional fields
  let flat = Papa.unparse(arr.map(row => {
    //Alphabetically order keys
    var unsorted = nested2flat(row)
    var sorted   = {}
    Object.keys(unsorted).sort().forEach(key => sorted[key] = unsorted[key])
    return sorted
  }))
  let file = new Blob([flat], {type:'text/csv;charset=utf-8;'})
  let link = document.createElement('a')

  link.href = window.URL.createObjectURL(file)
  link.setAttribute('download', name)
  link.click()
}
