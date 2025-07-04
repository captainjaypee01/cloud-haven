export const createGetParameters = (params) => {
  let url = "";

  if (Object.keys(params).length > 0) {
    let queryString = convertObjectToQueryString(params);
    url = "?" + queryString;
  }

  return url;
}

export const convertObjectToQueryString = (obj, prefix = "") => {
  let queryString = "";

  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      let value = obj[key];
      let paramName = prefix ? prefix + "[" + key + "]" : key;
      if (value === undefined) continue;

      if (typeof value === "object") {
        if (Array.isArray(value)) {
          for (let i = 0; i < value.length; i++) {
            queryString += paramName + "[]=" + encodeSpecialCharacters(value[i]) + "&";
          }
        } else {
          queryString += convertObjectToQueryString(value, paramName);
        }
      } else {
        queryString += paramName + "=" + encodeSpecialCharacters(value) + "&";
      }
    }
  }

  queryString = queryString.slice(0, -1);

  return queryString;
}

export const encodeSpecialCharacters = (input) => {
  return encodeURIComponent(input)
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/'/g, '%27')
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/~/g, '%7E'); // Add more replacements if needed
}