#ifndef BOT_H
#define BOT_H

#include "character.h"

enum BotState {
    Attack,
    Flee,
    Walk,
    Stand,
    WaitReload
};

class Bot : public Character {
    Q_DISABLE_COPY(Bot)

    public:
        Bot(Map *map, Bridge *view, QQuickItem *item, QPoint pos);
        void goLeft() override;
        void goRight() override;
        virtual bool update() override;
    private:
        bool isHeroVisible();
        bool canAttack();

    private:
        BotState state = BotState::Attack;
};

#endif // BOT_H
