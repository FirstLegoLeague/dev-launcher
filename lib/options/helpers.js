
const coerceRegex = exports.coerceRegex = regex => {
  return opt => {
    if (!regex.test(opt)) {
      throw new Error(`Invalid input ${opt}`)
    }

    return opt
  }
}

exports.coerceAlphaNum = coerceRegex(/^[A-Za-z0-9]*$/)
