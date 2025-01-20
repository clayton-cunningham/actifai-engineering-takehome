'use strict';

const formatRole = (role) => {
    let words = role.split(' ');
    let result = words.filter(word => word).map(word => word[0].toUpperCase() + word.substring(1, word.length).toLowerCase());

    return result.join(' ');
}

module.exports = {
    formatRole
}