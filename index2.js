

function flat2nested(obj) {
    var res = {}
    for (var path in obj) {
        arr = path.split('.')
        curr = res
        for (var i in arr) {
            var key = arr[i]
            if (i < arr.length - 1) {
                curr = curr[key] = curr[key] || {}; continue
            }
            if (typeof obj[path] == 'string')
                obj[path] = obj[path].trim()

            curr[key] = obj[path] || null
        }
    }
    return res
}

var nested2flat = function (obj) {
    var flat = {}
    for (var i in obj) {
        if (obj[i] === null || typeof obj[i] != 'object') {
            flat[i] = obj[i]; continue
        }
        var flatObject = nested2flat(obj[i])
        var delimited = i && !Array.isArray(obj)
        for (var j in flatObject) {

            key = delimited ? i + '.' + j : j

            flat[key]
                ? flat[key] += ';' + flatObject[j]
                : flat[key] = flatObject[j]
        }
    }
    return flat
}

function parse(file, rows) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            preview: rows,
            complete: function (results, file) {
                resolve(results)
            },
            error: function (err, file) {
                console.log("error encountered when parsing", err);
            }
        })
    })
}

function toJSON(file, callback) {
    return parse(file, 0).then(results => {
        console.log("results after first then", results.data);
        return results;
    }).then(results => {
        //if (results.errors) return handleParseError(results.errors);
        for (var i in results.data) {
            results.data[i] = flat2nested(results.data[i])
            console.log("datai is", results.data[i]);
        }
        var final = results.data.reverse()
        return callback(final); //  hand off parsed json to upload function returns a promise
    }).then(dbresults => {
        // dbresults will be an array or successes and errors
        // how are we specifying user action for skip, download csv, etc.
        if(1 /**download all data including original rows**/) {
            window.open(file) //just return original file
        }
        if(2 /**download only rows with errors**/) {
            return promise.then(rows => rows.filter(row => row.error))
        }
        if(3 /** download rows that were successfully uplaoded*/) {
            return promise.then(rows => rows.filter(row => row.ok))  
        }
        return // none of the above

    })
}


function toCSV(name, arr) {
    //Flatten object
    //TODO some sort of check for all required and optional fields
    let flat = Papa.unparse(arr.map(row => {
        //Alphabetically order keys
        var unsorted = nested2flat(row)
        var sorted = {}
        var fields = Object.keys(unsorted).concat(this.requiredFields).concat(this.optionalFields)
        fields.sort().forEach(key => sorted[key] = unsorted[key])
        return sorted
    }))

    //maintain user download workflow?
}