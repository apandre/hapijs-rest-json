/**
 * @summary remove element from array
 */
var removeArrayElement = function ( array, element ) {
	const index = array.indexOf(element);

	if (index !== -1) {
		array.splice(index, 1);
	}
	return array;
}


module.exports = {
	removeArrayElement
};
