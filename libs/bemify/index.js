function Bemifier() {
    this.bemBlocks = [];

    this.prevToken = this.prevToken || null;

    this.currentBEMBlock = this.currentBEMBlock || null;
    this.currentBEMElement = this.currentBEMElement || null;
}

Bemifier.prototype = {
    bemify: function (token, settings) {
        if (this.prevToken) {
            switch (this.prevToken.type) {
                case 'outdent':
                case 'newline':
                    if (this.currentBEMBlock && token.col <= this.currentBEMBlock.col) {
                        this.bemBlocks.pop();
                    }
                    this.currentBEMBlock = this.bemBlocks[this.bemBlocks.length - 1];
            }
        }
        this.prevToken = token;
        if (token.type == 'class') {
            if (token.val.match(/^[a-zA-Z]/)) {
                this.bemBlocks.push(token);
                this.currentBEMBlock = token;
                this.currentBEMElement = null;
            } else if (token.val.startsWith(settings.element + settings.element)) {
                token.val = token.val.replace(settings.element + settings.element, this.bemBlocks[this.bemBlocks.length - 2].val + settings.element);
                this.currentBEMElement = token;
            } else if (token.val.startsWith(settings.element)) {
                if (token.val.endsWith(settings.element)) {
                    token.val = token.val.replace(/_/g, "");
                    this.bemBlocks.push(Object.assign({}, token));
                    token.val = this.currentBEMBlock.val + settings.element + token.val + " " + token.val
                    this.currentBEMBlock = this.bemBlocks[this.bemBlocks.length - 1];
                    this.currentBEMElement = null;
                } else {
                    token.val = this.currentBEMBlock.val + token.val;
                    this.currentBEMElement = token;
                }
            } else if (token.val.startsWith(settings.modifier)) {
                if (this.currentBEMElement)
                    token.val = this.currentBEMElement.val + token.val;
                else if (this.currentBEMBlock)
                    token.val = this.currentBEMBlock.val + token.val;
            }
        }
    }
};

module.exports = function () {
    var settings = {
        'element': '_',
        'modifier': '--'
    };
    var bemifier = new Bemifier();
    return {
        postLex: function (tokens) {
            tokens.forEach(function (token) {
                bemifier.bemify(token, settings);
            });
            return tokens;
        }
    }
};
