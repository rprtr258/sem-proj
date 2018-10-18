#ifndef PLAYER_H
#define PLAYER_H

#include <QObject>
#include "map.h"

class Player : public QObject {
    Q_OBJECT
    Q_PROPERTY(qint32 x READ x WRITE setX NOTIFY xChanged)
    Q_PROPERTY(qint32 y READ y WRITE setY NOTIFY yChanged)
    Q_DISABLE_COPY(Player)

    public:
        Player(Map &m_map);
        void goLeft();
        void stopLeft();
        void goRight();
        void stopRight();
        void jump();
        void stopJump();

        void update();

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
signals:
        void xChanged();
        void yChanged();

private:
        void flipSprite();
        void moveHorizontal(qint32 speed);
        void moveVertical(qint32 speed);
    private:
        qint32 m_xCoord;
        qint32 m_yCoord;
        qint32 m_vspeed;
        MyRectangle m_boundingBox;
        Map *m_map;
        bool m_goingLeft;
        bool m_goingRight;
        bool m_jumping;
        bool m_spriteFlipped;
};

#endif // PLAYER_H
