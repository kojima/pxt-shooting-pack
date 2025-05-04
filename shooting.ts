/**
 * Shooting blocks
 * https://github.com/microsoft/pxt-common-packages/blob/master/libs/game
 */
//% weight=100 color=#0fbc11 icon="\uf0fb" block="シューティング"
namespace shooting {
    const stateNamespace = "__shooting_pack";

    type AnimationHandlers = {
        itemHandlerRegistered?: boolean,
    }

    type Sprite2DActionPackData = {
        sprite: Sprite,
        items?: Sprite[]
    }

    /*
     * スプライトを点滅させる 
     */
    //% block="スプライト %sprite を %t ミリ秒間点滅させる||点滅間隔 %interval"
    //% sprite.shadow=variables_get
    //% sprite.defl=mySprite
    //% t.defl=1000
    //% interval.defl=50
    //% group="スプライト"
    //% weight=97
    export function blinkSprite(sprite: Sprite, t: number, interval?: number) {
        let invisible = false;
        const i = setInterval(() => {
            invisible = !invisible;
            sprite.setFlag(SpriteFlag.Invisible, invisible);
        }, interval);
        setTimeout(() => {
            clearInterval(i);
            sprite.setFlag(SpriteFlag.Invisible, false);
        }, t);
    }

    /**
     * スプライトからprojectileを一定確率で発射する (kind指定)
     */
    //% block="スプライトタイプ %spritekind=spritekind から %chance|\\%の確率で %img=screen_image_picker を vx %vx vy %vy で発射する (%kind=spritekind タイプ)"
    //% group="スプライト"
    //% inlineInputMode=inline
    //% vx.defl=-100
    //% vy.defl=-100
    //% chance.defl=50
    //% weight=96
    export function createProjectileFromSpriteWithChance(spritekind: number, chance: number, img: Image, vx: number, vy: number, kind: number): void {
        for (let value of sprites.allOfKind(spritekind)) {
            if (Math.percentChance(chance)) {
                const projectile = sprites.createProjectileFromSprite(img, value, vx, vy)
                projectile.setKind(kind)
            }
        }
    }

    /*
     * 背景をスクロールする 
     */
    //% block="背景 %img=background_image_picker を vx %vx vy %vy でスクロールする"
    //% vx.defl=-50
    //% vy.defl=0
    //% group="シーン"
    //% weight=95
    export function scrollBackgroundWithSpeed(img: Image, vx: number, vy: number) {
        scroller.setLayerImage(scroller.BackgroundLayer.Layer0, img);
        scroller.scrollBackgroundWithSpeed(vx, vy);
    }

    /**
     * HPステータスバーをスプライトに設定する
     */
    //% block="HPステータスバーをスプライト%sprite=variables_get(mySprite) に設定する || (幅: %width , 高さ: %height, オフセット: %offset)"
    //% expandableArgumentMode="toggle"
    //% inlineInputMode=inline
    //% width.defl=20
    //% height.defl=4
    //% offset.defl=4
    //% group="HPステータスバー"
    //% weight=94
    export function setHPStatusBarToSprite(sprite: Sprite, width: number = 20, height: number = 4, offset: number = 4) {
        let statusbar = statusbars.create(width, height, StatusBarKind.Health)
        statusbar.attachToSprite(sprite)
        statusbar.setOffsetPadding(0, offset)
    }

    /*
     * スプライトのHPステータスバーの値を変える
     */
    //% block="スプライト%sprite=variables_get(mySprite) のHPステータスバーの値を%value だけ変える"
    //% value.defl=-10
    //% group="HPステータスバー"
    //% weight=92
    export function changeHPStatusBarValue(sprite: Sprite, value: number = -10) {
        let statusbar = statusbars.getStatusBarAttachedTo(StatusBarKind.Health, sprite)
        if (statusbar) {
            if (value > 0) {
                statusbar.value = Math.min(100, statusbar.value + value)
            } else {
                statusbar.value = Math.max(0, statusbar.value + value)
            }
        }
    }

    /**
     * HPステータスバーがゼロになったとき
     */
    //% block="HPステータスバーがゼロになったとき"
    //% draggableParameters="reporter"
    //% group="HPステータスバー"
    //% weight=91
    export function onHPStatusBarZero(handler: (sprite: Sprite, kind: number) => void) {
        const dataKey = `${stateNamespace}_on_hp_zero`
        let handlers = game.currentScene().data[dataKey] as ((sprite: Sprite, spriteKind: number) => void)[]
        if (!handlers) {
            handlers = game.currentScene().data[dataKey] = [] as ((sprite: Sprite, spriteKind: number) => void)[]
        }
        handlers.push(handler)
    }

    statusbars.onZero(StatusBarKind.Health, (statusbar: StatusBarSprite) => {
        const dataKey = `${stateNamespace}_on_hp_zero`
        const handlers = (game.currentScene().data[dataKey] || []) as ((sprite: Sprite, spriteKind: number) => void)[]
        for (let i = 0; i < handlers.length; i++) {
            const handler = handlers[i]
            const sprite = statusbar.spriteAttachedTo()
            handler(sprite, sprite.kind());
        }
    })

    function alignItems(items: Sprite[]) {
        const itemLeft = info.hasLife() ? Math.round(32 + (Math.log(info.life()) / Math.log(10) + 1) * 5) : 8
        let x = itemLeft
        let y = 8
        const scale = 0.6
        const gap = 6
        items.forEach((item) => {
            item.setPosition(x, y)
            item.setScale(scale, ScaleAnchor.Middle)
            item.setFlag(SpriteFlag.RelativeToCamera, true)
            x += item.width * scale + gap
            if (x > screen.width * 0.85) {
                x = itemLeft
                y += 12
            }
        })
    }

    /**
     * スプライトにアイテムを追加する
     */
    //% block="スプライト%sprite=variables_get(mySprite) にアイテム%item=variables_get(item)を追加する"
    //% group="アイテム管理"
    //% weight=89
    export function addItemToSprite(sprite: Sprite, item: Sprite) {
        if (!sprite || !item) return

        const dataKey = stateNamespace

        let spriteDicts = game.currentScene().data[dataKey]
        if (!spriteDicts) {
            spriteDicts = game.currentScene().data[dataKey] = {}
        }
        let data = spriteDicts[sprite.id] as Sprite2DActionPackData | undefined
        if (data) {
            if (data.items && data.items.indexOf(item) < 0) {
                data.items.push(item)
            } else {
                data.items = [item]
            }
        } else {
            data = {
                sprite: sprite,
                items: [item]
            }
        }
        spriteDicts[sprite.id] = data

        let handlers = game.currentScene().data[`${stateNamespace}_handlers`] as AnimationHandlers
        if (!handlers || !handlers.itemHandlerRegistered) {
            if (!handlers) handlers = { itemHandlerRegistered: true }
            else handlers.itemHandlerRegistered = true

            game.eventContext().registerFrameHandler(scene.ANIMATION_UPDATE_PRIORITY, () => {
                alignItems(data.items);
            })
        }
        game.currentScene().data[`${stateNamespace}_handlers`] = handlers
    }


    /**
     * スプライトにアイテムがアイテムを保持しているかチェックする (Spriteでチェックする)
     */
    //% block="スプライト%sprite=variables_get(mySprite) が%item=variables_get(item) をアイテムとして保持している"
    //% group="アイテム管理"
    //% weight=88
    export function spriteHasSpriteItem(sprite: Sprite, itemSprite: Sprite): boolean {
        if (!sprite || !itemSprite) return false;

        const dataKey = stateNamespace

        let spriteDicts = game.currentScene().data[dataKey]
        if (!spriteDicts) return false
        let data = spriteDicts[sprite.id] as Sprite2DActionPackData
        if (!data || !data.items) return false

        let hasItem = false
        data.items.forEach((item: Sprite) => {
            if (item === itemSprite) hasItem = true
        })
        return hasItem
    }


    /**
     * スプライトがアイテムを保持しているかチェックする (kindでチェックする)
     */
    //% block="スプライト%sprite=variables_get(mySprite) が%kind=spritekind タイプのアイテムを保持している"
    //% group="アイテム管理"
    //% weight=87
    export function spriteHasItem(sprite: Sprite, kind: number): boolean {
        if (!sprite) return false;

        const dataKey = stateNamespace

        let spriteDicts = game.currentScene().data[dataKey]
        if (!spriteDicts) return false
        let data = spriteDicts[sprite.id] as Sprite2DActionPackData
        if (!data || !data.items) return false

        let hasItem = false
        data.items.forEach((item: Sprite) => {
            if (item.kind() === kind) hasItem = true
        })
        return hasItem
    }


    /**
     * スプライトの保持アイテムからアイテムを削除する (Sprite指定)
     */
    //% block="スプライト%sprite=variables_get(mySprite) の保持アイテムからアイテム%itemSprite=variables_get(item) を削除する"
    //% group="アイテム管理"
    //% weight=86
    export function deleteItemSprite(sprite: Sprite, itemSprite: Sprite): void {
        if (!sprite) return

        const dataKey = stateNamespace

        let spriteDicts = game.currentScene().data[dataKey]
        if (!spriteDicts) return
        let data = spriteDicts[sprite.id] as Sprite2DActionPackData
        if (!data || !data.items) return

        const deleteIndex: number[] = [];
        data.items.forEach((item: Sprite, index: number) => {
            if (item === itemSprite) {
                item.destroy()
                deleteIndex.push(index)
            }
        })
        deleteIndex.reverse()
        for (const i of deleteIndex) {
            data.items.splice(i, 1)
        }
        spriteDicts[sprite.id] = data
    }


    /**
     * スプライトの保持アイテムからアイテムを削除する (kind指定)
     */
    //% block="スプライト%sprite=variables_get(mySprite) の保持アイテムから%kind=spritekind タイプのアイテムを削除する"
    //% group="アイテム管理"
    //% weight=85
    export function deleteItem(sprite: Sprite, kind: number): void {
        if (!sprite) return

        const dataKey = stateNamespace

        let spriteDicts = game.currentScene().data[dataKey]
        if (!spriteDicts) return
        let data = spriteDicts[sprite.id] as Sprite2DActionPackData
        if (!data || !data.items) return

        const deleteIndex: number[] = [];
        data.items.forEach((item: Sprite, index: number) => {
            if (item.kind() === kind) {
                item.destroy()
                deleteIndex.push(index)
            }
        })
        deleteIndex.reverse()
        for (const i of deleteIndex) {
            data.items.splice(i, 1)
        }

        alignItems(data.items)
        spriteDicts[sprite.id] = data
    }
}
