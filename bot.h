#ifndef BOT_H
#define BOT_H

#include <QQuickItem>
#include <QRect>

#include "map.h"
#include "character.h"

enum BotState {
    Attack,
    Flee,
    Walk,
    Respawn
};

class Bot : public Character {
    Q_DISABLE_COPY(Bot)

    public:
        Bot(Map *m_map, Observer *view, QQuickItem *item, QPoint *playerPosition, QPoint botPosition);

        virtual bool update() override;
    private:
        bool isHeroVisible(QPoint playerCoord, QPoint botCoord);
        bool canAttack();
        bool isSafePlace(QPoint playerCoord, QPoint botCoord);
        bool thereIsSafePlace(QPoint &safePlaceCoord, QPoint playerCoord, QPoint botCoord);

        QVector2D getHandPosition() override;

        void changeStandTime(qint32 value) {
            m_standTime += value;
        }

        qint32 getWidthBoundingBox() {
            return m_boundingBox.width();
        }

    private:
        QPoint *m_playerCoord;
        qint32 m_standTime;
        BotState state = Respawn;
        BotState lastActivity = Respawn;
};

#endif // BOT_H
