class BemToken {
    constructor(bemifier, token) {
        this.bemifier = bemifier
        this.token = token

        this.block = null
        this.element = null
        this.modifier = null
        this.type = token.type
        this.line = token.line
        this.col = bemifier.lines.get(this.line)
        this.val = null
    }

    updateValue() {
        var val = this.block
        if (this.element)
            val += this.bemifier.settings.element + this.element
        if (this.modifier)
            val += this.bemifier.settings.modifier + this.modifier
        this.val = val
        return this
    }

    setBlock(block) {
        this.block = block
        return this
    }

    setElement(element) {
        this.element = element
        return this
    }

    setModifier(modifier) {
        this.modifier = modifier
        return this
    }
}

class Bemifier {
    constructor() {
        this.bemTokens = []
        this.bemBlocks = []

        this.prevToken = null
        this.currentBlock = null
        this.currentElement = null

        this.lines = new Map()

        this.settings = {
            'element': '_',
            'beforeBlock': '__',
            'modifier': '--'
        };
    }

    setCurrentBlock(bemToken) {
        this.currentBlock = bemToken
        this.currentElement = null

        if (this.bemBlocks.length >= 2 && this.getBlock(1).line == this.getBlock(2).line)
            this.bemBlocks.pop()

        this.bemBlocks.push(bemToken)
    }

    setCurrentElement(element) {
        this.currentElement = element
    }

    getBlock(index) {
        return this.bemBlocks[this.bemBlocks.length - index]
    }

    bemify(token) {
        if (this.lines.size < token.line && (token.type == "tag" || token.type == "class") && !this.lines.has(token.line))
            this.lines.set(token.line, token.col)

        if (this.prevToken) {
            switch (this.prevToken.type) {
                case 'outdent':
                case 'newline':
                    if (this.currentBlock && this.lines.get(token.line) <= this.lines.get(this.currentBlock.line)) {
                        this.bemBlocks.pop()
                        if (this.getBlock(1))
                            this.currentBlock = this.getBlock(1)
                        else
                            this.currentBlock = null
                    }
            }
        }
        this.prevToken = token;

        if (token.type == "class") {
            if (token.val.match(/^[a-zA-Z]/)) { // NewBlock
                var arr = token.val.split("--")
                var block = new BemToken(this, token)
                    .setBlock(arr[0])
                    .updateValue()
                this.bemTokens.push(block)
                if (arr[1])
                    this.bemTokens.push(
                        new BemToken(this, token)
                        .setBlock(arr[0])
                        .setModifier(arr[1])
                        .updateValue()
                    )

                this.setCurrentBlock(block)
            } else if (token.val.match(this.settings.beforeBlock)) { // PrevBlock
                token.val = token.val.replace(/_/g, "")
                var currentBemBlock = this.getBlock(2).val

                var arr = token.val.split("--")
                this.bemTokens.push(
                    new BemToken(this, token)
                    .setBlock(currentBemBlock)
                    .setElement(arr[0])
                    .updateValue()
                )
                if (arr[1])
                    this.bemTokens.push(
                        new BemToken(this, token)
                        .setBlock(currentBemBlock)
                        .setElement(arr[0])
                        .setModifier(arr[1])
                        .updateValue()
                    )
            } else if (token.val.match(this.settings.element)) { // NewElement
                var newBlock = token.val.endsWith(this.settings.element) // NewBlock
                token.val = token.val.replace(/_/g, "")

                var arr = token.val.split("--")
                this.currentElement = arr[0]
                this.bemTokens.push(
                    new BemToken(this, token)
                    .setBlock(this.currentBlock.block)
                    .setElement(arr[0])
                    .updateValue()
                )
                if (arr[1])
                    this.bemTokens.push(
                        new BemToken(this, token)
                        .setBlock(this.currentBlock.block)
                        .setElement(arr[0])
                        .setModifier(arr[1])
                        .updateValue()
                    )

                if (newBlock) {
                    var block = new BemToken(this, token)
                        .setBlock(arr[0])
                        .updateValue()
                    this.bemTokens.push(block)
                    this.setCurrentBlock(block)
                }
            } else if (token.val.match(this.settings.modifier)) { // NewModifier
                var modifier = token.val.replace(/--/g, "")
                this.bemTokens.push(
                    new BemToken(this, token)
                    .setBlock(this.currentBlock.block)
                    .setElement(this.currentElement)
                    .setModifier(modifier)
                    .updateValue()
                )
            }
        } else
            this.bemTokens.push(token)
    }
}

module.exports = function() {
    var bemifier = new Bemifier()
    return {
        postLex: function(tokens) {
            tokens.forEach(function(token) {
                bemifier.bemify(token)
            });
            return bemifier.bemTokens
        }
    }
};