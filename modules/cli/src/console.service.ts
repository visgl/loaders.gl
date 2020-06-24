import { Injectable } from '@nestjs/common';
import { ConsoleService } from 'nestjs-console';
import Converter3dTilesToI3S from "./lib/converters/3d-tiles-to-i3s";

@Injectable()
export class Console {
    constructor(private readonly consoleService: ConsoleService) {
        // get the root cli
        const cli = this.consoleService.getCli();

        // create a single command (See [npm commander arguments/options for more details])
        this.consoleService.createCommand(
            {
                command: 'convert <tileset> <tilesetName> <output>',
                description: 'Convert 3dtiles to i3s'
            },
            this._converter,
            cli // attach the command to the cli
        );
    }

    _converter = async (tileset: string, tilesetName: string, output: string): Promise<any> => {
        console.log("Start load 3dTiles");

        const converter = new Converter3dTilesToI3S();
        const tilesetJson = converter.convert(tileset, output, tilesetName);

        console.log("Stop load 3dTiles");
        return tilesetJson;
    };
}
