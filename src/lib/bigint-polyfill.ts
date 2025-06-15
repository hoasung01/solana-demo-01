'use client'

if (typeof BigInt !== 'undefined') {
  BigInt.prototype.toJSON = function () {
    return this.toString()
  }
}
