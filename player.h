#ifndef PLAYER_H
#define PLAYER_H

#include <QObject>
#include <QQuickItem>
#include <QRect>
#include "creature.h"
#include "map.h"

class Player : public QObject, public Creature {
    Q_OBJECT
    Q_DISABLE_COPY(Player)

    public:
        Player(Map &m_map, QQuickItem *item);
        void goLeft();
        void stopLeft();
        void goRight();
        void stopRight();
        void jump();
        void stopJump();
        void attack();

        virtual bool update() override;

        qint32 x() const {
            return m_xCoord;
        }
        void setX(qint32 value) {
            if (m_xCoord == value)
                return;
            m_xCoord = value;
            emit xChanged();
        }
        qint32 y() const {
            return m_yCoord;
        }
        void setY(qint32 value) {
            if (m_yCoord == value)
                return;
            m_yCoord = value;
            emit yChanged();
        }
        qint32 health() {
            return m_health;
        }
        void setHealth(qint32 value) {
            if (m_health == value)
                return;
            m_health = value;
            emit healthChanged();
        }
        qint32 mana() {
            return m_mana;
        }
        void setMana(qint32 value) {
            if (m_mana == value)
                return;
            m_mana = value;
            emit manaChanged();
        }
        bool flipped() {
            return m_spriteFlipped;
        }
        QRect getBoundingBox() {
            return m_boundingBox;
        }
        QVector2D getPosition() {
            return QVector2D(x(), y());
        }
    signals:
        void xChanged();
        void yChanged();
        void spriteFlipped();
        void goingChanged();
        void inAirChanged();
        void healthChanged();
        void manaChanged();
    private:
        void flipSprite() {
            m_spriteFlipped = not m_spriteFlipped;
            emit spriteFlipped();
        }
        void moveHorizontal(qint32 speed);
        void moveVertical(qint32 speed);
    private:
        qint32 m_xCoord;
        qint32 m_yCoord;
        qint32 m_vspeed;
        qint32 m_health;
        qint32 m_mana;
        qint32 m_reload;
        QRect m_boundingBox;
        QQuickItem *m_item;
        Map *m_map;
        bool m_goingLeft;
        bool m_goingRight;
        bool m_jumping;
        bool m_spriteFlipped;
        bool goingChangingNotified = true;
        bool m_inAir = true;
};

#endif // PLAYER_H
