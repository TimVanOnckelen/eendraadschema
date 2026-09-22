import { Electro_Item } from "./Electro_Item";
import { htmlspecialchars } from "../general";
import { SVGelement } from "../SVGelement";

export class Leiding extends Electro_Item {
    getMaxNumChilds(): number { return 256; }

    convertLegacyKeys(mykeys: Array<[string,string,any]>) { mykeys; }

    resetProps() {
        this.clearProps();
        this.props.type = "Leiding";
        this.props.type_kabel = "XVB Cca 3G2,5";
        this.props.kabel_locatie = "N/A";
        this.props.kabel_is_in_buis = false;
        this.props.adres = "";
    }

    overrideKeys() {
        if (this.props.kabel_locatie == "Luchtleiding") this.props.kabel_is_in_buis = false;
    }

    toHTML(mode: string) {
        let output = this.toHTMLHeader(mode);
        output += "&nbsp;" + this.nrToHtml()
               + "Type: " + this.stringPropToHTML('type_kabel',10)
               + ", Plaatsing: " + this.selectPropToHTML('kabel_locatie',["N/A","Ondergronds","Luchtleiding","In wand","Op wand"]);
        if (this.props.kabel_locatie != "Luchtleiding") output += ", In buis: " + this.checkboxPropToHTML('kabel_is_in_buis');
        return output;
    }

    toSVG() {
        this.overrideKeys();
        const parent = this.getParent();

        // A cable change directly below a Kring extends the main vertical
        // branch. Inside a branch element (for example Aftakdoos), it is an
        // inline horizontal segment instead.
        if (parent && parent.getType() !== "Kring") {
            const children = this.sourcelist.toSVG(this.id, "horizontal");
            const cableWidth = 100;
            const segment = '<line x1="1" y1="25" x2="' + (cableWidth + 1) + '" y2="25" stroke="black" />'
                + '<text x="15" y="39" style="text-anchor:start" font-family="Arial, Helvetica, sans-serif" font-size="10">'
                + htmlspecialchars(this.props.type_kabel) + '</text>';
            const maxYup = Math.max(25, children.yup);
            const maxYdown = Math.max(25, children.ydown);
            const childX = cableWidth;
            const childY = maxYup - children.yup;
            return {
                data: segment + '<svg x="' + childX + '" y="' + childY + '">' + children.data + '</svg>',
                xleft: 1,
                xright: cableWidth + children.xleft + children.xright,
                yup: maxYup,
                ydown: maxYdown,
                xrightmin: cableWidth + children.xright,
                connectorPos: []
            } as SVGelement;
        }

        // Children continue above this cable segment in the vertical schema.
        const mySVG: SVGelement = this.sourcelist.toSVG(this.id, "vertical");
        const cableHeight = 100;
        const x = mySVG.xleft;
        const y = mySVG.yup;

        mySVG.data += '<line x1="' + x + '" x2="' + x + '" y1="' + y + '" y2="' + (y + cableHeight) + '" stroke="black" />';
        if (this.props.kabel_locatie === "Luchtleiding") {
            mySVG.data += '<circle cx="' + x + '" cy="' + (y + 20) + '" r="4" style="stroke:black;fill:none" />';
        }
        if (this.props.kabel_is_in_buis && this.props.kabel_locatie !== "Luchtleiding") {
            mySVG.data += '<circle cx="' + (x - 10) + '" cy="' + (y + 40) + '" r="4" style="stroke:black;fill:none" />';
        }
        switch (this.props.kabel_locatie) {
            case "Ondergronds":
                mySVG.data += '<line x1="' + (x - 13) + '" x2="' + (x - 13) + '" y1="' + (y + 60) + '" y2="' + (y + 80) + '" style="stroke:black" />'
                    + '<line x1="' + (x - 10) + '" x2="' + (x - 10) + '" y1="' + (y + 62) + '" y2="' + (y + 78) + '" style="stroke:black" />'
                    + '<line x1="' + (x - 7) + '" x2="' + (x - 7) + '" y1="' + (y + 64) + '" y2="' + (y + 76) + '" style="stroke:black" />';
                break;
            case "In wand":
                mySVG.data += '<line x1="' + (x - 15) + '" x2="' + (x - 15) + '" y1="' + (y + 10) + '" y2="' + (y + 30) + '" style="stroke:black" />'
                    + '<line x1="' + (x - 15) + '" x2="' + (x - 5) + '" y1="' + (y + 10) + '" y2="' + (y + 10) + '" style="stroke:black" />'
                    + '<line x1="' + (x - 15) + '" x2="' + (x - 5) + '" y1="' + (y + 20) + '" y2="' + (y + 20) + '" style="stroke:black" />'
                    + '<line x1="' + (x - 15) + '" x2="' + (x - 5) + '" y1="' + (y + 30) + '" y2="' + (y + 30) + '" style="stroke:black" />'
                    + '<line x1="' + (x - 15) + '" x2="' + (x - 15) + '" y1="' + (y + 65) + '" y2="' + (y + 85) + '" style="stroke:black" />'
                    + '<line x1="' + (x - 15) + '" x2="' + (x - 5) + '" y1="' + (y + 65) + '" y2="' + (y + 65) + '" style="stroke:black" />'
                    + '<line x1="' + (x - 15) + '" x2="' + (x - 5) + '" y1="' + (y + 75) + '" y2="' + (y + 75) + '" style="stroke:black" />'
                    + '<line x1="' + (x - 15) + '" x2="' + (x - 5) + '" y1="' + (y + 85) + '" y2="' + (y + 85) + '" style="stroke:black" />';
                break;
            case "Op wand":
                mySVG.data += '<line x1="' + (x - 5) + '" x2="' + (x - 5) + '" y1="' + (y + 10) + '" y2="' + (y + 30) + '" style="stroke:black" />'
                    + '<line x1="' + (x - 15) + '" x2="' + (x - 5) + '" y1="' + (y + 10) + '" y2="' + (y + 10) + '" style="stroke:black" />'
                    + '<line x1="' + (x - 15) + '" x2="' + (x - 5) + '" y1="' + (y + 20) + '" y2="' + (y + 20) + '" style="stroke:black" />'
                    + '<line x1="' + (x - 15) + '" x2="' + (x - 5) + '" y1="' + (y + 30) + '" y2="' + (y + 30) + '" style="stroke:black" />'
                    + '<line x1="' + (x - 5) + '" x2="' + (x - 5) + '" y1="' + (y + 65) + '" y2="' + (y + 85) + '" style="stroke:black" />'
                    + '<line x1="' + (x - 15) + '" x2="' + (x - 5) + '" y1="' + (y + 65) + '" y2="' + (y + 65) + '" style="stroke:black" />'
                    + '<line x1="' + (x - 15) + '" x2="' + (x - 5) + '" y1="' + (y + 75) + '" y2="' + (y + 75) + '" style="stroke:black" />'
                    + '<line x1="' + (x - 15) + '" x2="' + (x - 5) + '" y1="' + (y + 85) + '" y2="' + (y + 85) + '" style="stroke:black" />';
                break;
        }
        mySVG.data += '<text x="' + (x + 15) + '" y="' + (y + 80) + '" transform="rotate(-90 ' + (x + 15) + ',' + (y + 80) + ')" style="text-anchor:start" font-family="Arial, Helvetica, sans-serif" font-size="10">'
                    + htmlspecialchars(this.props.type_kabel) + '</text>';
        mySVG.yup += cableHeight;
        mySVG.xright = Math.max(mySVG.xright, 25);
        return mySVG;
    }
}
