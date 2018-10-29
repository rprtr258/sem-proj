#ifndef PLAYER_H
#define PLAYER_H

#include <QObject>
#include <QRect>
#include "creature.h"
#include "map.h"

class Player : public QObject, public Creature {
    Q_OBJECT
    Q_PROPERTY(qint32 x READ x NOTIFY xChanged)
    Q_PROPERTY(qint32 y READ y NOTIFY yChanged)
    Q_PROPERTY(bool flipped READ flipped NOTIFY spriteFlipped)
    Q_PROPERTY(bool going READ going NOTIFY goingChanged)
    Q_PROPERTY(bool inAir READ inAir NOTIFY inAirChanged)
    Q_DISABLE_COPY(Player)

    public:
        Player(Map &m_map);
        void goLeft();
        void stopLeft();
        void goRight();
        void stopRight();
        void jump();
        void stopJump();

        virtual void update() override;

        qint32 x() const {
            return m_xCoord;
        }
        void setX(qint32 _x) {
            if (m_xCoord == _x)
                return;
            m_xCoord = _x;
            emit xChanged();
        }
        qint32 y() const {
            return m_yCoord;
        }
        void setY(qint32 _y) {
            if (m_yCoord == _y)
                return;
            m_yCoord = _y;
            emit yChanged();
        }
        bool flipped() {
            return m_spriteFlipped;
        }
        bool going() {
            return m_goingLeft xor m_goingRight;
        }
        bool inAir() {
            return m_inAir;
        }
        void setInAir(bool value) {
            if (m_inAir == value)
                return;
            m_inAir = value;
            emit inAirChanged();
        }
    signals:
        void xChanged();
        void yChanged();
        void spriteFlipped();
        void goingChanged();
        void inAirChanged();

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
        QRect m_boundingBox;
        Map *m_map;
        bool m_goingLeft;
        bool m_goingRight;
        bool m_jumping;
        bool m_spriteFlipped;
        bool goingChangingNotified = true;
        bool m_inAir = true;
};

#endif // PLAYER_H
