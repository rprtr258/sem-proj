#include <QRandomGenerator>

#include "bot.h"
#include "gun.h"

/*bool Bot::thereIsSafePlace(QPoint &safePlaceCoord, QPoint playerCoord, QPoint botCoord) {
    QPoint leftPoint = QPoint(botCoord.x() + 27, botCoord.y() + 47);
    QPoint rightPoint = QPoint(botCoord.x() + 27, botCoord.y() + 47);

    if (!isHeroVisible(playerCoord, botCoord)) {
        leftPoint.setX(leftPoint.x() - 10);
        rightPoint.setY(rightPoint.x() + 10);
    }

    bool isLeftPoint = false;
    bool isRightPoint = false;
    bool isCross = false;

    int rightCoordLeftPoint = leftPoint.x();
    int leftCoordLeftPoint = leftPoint.x();
    while (not(m_map->isFilled(QRect((leftPoint - QPoint(27,47)).x() - 5, (leftPoint -  QPoint(27,47)).y(), 55, 95)))) {
        leftPoint.setX(leftPoint.x() - 5);
        if (isCross && isHeroVisible(leftPoint, playerCoord)) {
            leftCoordLeftPoint = leftPoint.x();
            isCross = false;
    //        std::cout << leftCoordLeftPoint <<"LeftCoord\n";
            break;
        }
        if (!isHeroVisible(leftPoint, playerCoord) && !isCross) {
            isLeftPoint = true;
            isCross = true;
            rightCoordLeftPoint = leftPoint.x();
      //      std::cout << rightCoordLeftPoint <<"RightCoord\n";
        }
    }

    if (isCross && (leftPoint.x() == 47)) {
        leftCoordLeftPoint = 47;
        isCross = false;
    }

    int rightCoordRightPoint = rightPoint.x();
    int leftCoordRightPoint = rightPoint.x();
    while (not(m_map->isFilled(QRect((rightPoint - QPoint(27,47)).x() + 5, (rightPoint - QPoint(27,47)).y(), 55, 95)))) {
        rightPoint.setX(rightPoint.x() + 5);

        if (isHeroVisible(rightPoint, playerCoord) && isCross) {
            rightCoordRightPoint = rightPoint.x();
            isCross = false;
            break;
        }

        if (!isHeroVisible(rightPoint, playerCoord) && !isCross) {
            isRightPoint = true;
            isCross = true;
            leftCoordRightPoint = rightPoint.x();
            break;
        }
    }

    if (isCross && (rightPoint.x() == 593)) {
        rightCoordRightPoint = 593;
        isCross = false;
    }

    int leftSafePoint = (rightCoordLeftPoint - 27 + leftCoordLeftPoint - 27) / 2;
    int rightSafePoint = (rightCoordRightPoint - 27 + leftCoordRightPoint - 27) / 2;

    std::cout << "safepoint coord1:  " << leftSafePoint << "\n";
    std::cout << "safepoint coord2:  " << rightSafePoint << "\n";
    if (isLeftPoint) {
        if (isRightPoint) {
            if (abs(botCoord.x() - leftSafePoint) < (abs(botCoord.x() - rightSafePoint))) {
                safePlaceCoord = QPoint(leftSafePoint, leftPoint.y() - 47);
            } else {
                safePlaceCoord = QPoint(rightSafePoint, rightPoint.y() - 47);
            }
        } else {
            safePlaceCoord = QPoint(leftSafePoint, leftPoint.y() - 47);
        }

        return true;
    } else if (isRightPoint) {
        safePlaceCoord = QPoint(rightSafePoint, rightPoint.y() - 47);
        return true;
    }
    return false;
}*/
//QStateMachine machine;
//QState *activeAttack = new QState;
//QState *activeGoingLeft = new QState;
//QState *activeGoingRight = new QState;
//QState *activeSafePlaceStand = new QState;
//QState *activeSafePlaceGoingLeft = new QState;
//QState *activeSafePlaceGoingRight = new QState;
//QState *respawn = new QState;
//QState *active = new QState;
//QState *activeGoing = new QState;
//QState *activeSafePlace = new QState;

Bot::Bot(Map *worldMap, Observer *view, QQuickItem *item, QPoint *playerPosition, QPoint botPosition) :
    Character(worldMap, view, item, botPosition) {
    m_reload = 0;
    m_vspeed = 0;
    m_playerCoord = playerPosition;
    m_standTime = 20;
}

bool isInScreen(QVector2D point) {
    const qint32 topScreenX = 640;
    const qint32 bottomScreenX = 0;
    const qint32 topScreenY = 480;
    const qint32 bottomScreenY = 0;
    return point.x() >= bottomScreenX && point.x() <= topScreenX &&
           point.y() >= bottomScreenY && point.y() <= topScreenY;
}

bool isInPlayerBoundingBox(QVector2D playerCoord, QVector2D point) {
    return point.x() >= playerCoord.x() && point.x() <= playerCoord.x() + 55 &&
           point.y() >= playerCoord.y() && point.y() <= playerCoord.y() + 95;
}

bool Bot::isHeroVisible(QPoint playerPosition, QPoint botPosition) {
    QVector2D botCoord = QVector2D(botPosition.x(), botPosition.y());
    QVector2D playerCoord = QVector2D(playerPosition.x(), playerPosition.y());
    QVector2D ofset = QVector2D(27, 47);
    QVector2D direction = (playerCoord + ofset - botCoord).normalized();
    if (direction == QVector2D(0,0)) {
        return true;
    }

    QVector2D position = botCoord;
    while (!m_map->isFilled(position.toPoint()) && isInScreen(position)) {
        position += direction;
        if (isInPlayerBoundingBox(playerCoord, position)) {
            return true;
        }
    }
    return false;
}

bool Bot::canAttack() {
    return isHeroVisible(*m_playerCoord, m_coord) && (m_mana >= m_weapon->getManaCost()) && (m_reload <= 0);
}

QVector2D Bot::getHandPosition() {
    const int offsetX1 = 47;
    const int offsetX2 = 8;
    const int offsetY = 25;

    if (m_spriteFlipped) {
        return QVector2D(m_coord.x() + offsetX2, m_coord.y() + offsetY);
    } else {
        return QVector2D(m_coord.x() + offsetX1, m_coord.y() + offsetY);
    }
}

bool Bot::update() {
    switch (state) {
        case Respawn: {
            qDebug() << "Respawn";
            stopRight();
            goLeft();
            if (m_mana >= m_weapon->getManaCost())
                state = Attack;
            else
                state = Flee;
            break;
        }

        case Attack: {
            qDebug() << "Attack";
            if (canAttack())
                attack(m_playerCoord->x() + 27, m_playerCoord->y() + 40);
            else
                state = Walk;
            if (m_playerCoord->x() <= m_coord.x()) {
                stopRight();
                goLeft();
            } else {
                stopLeft();
                goRight();
            }
            if (m_mana < m_weapon->getManaCost())
                state = Flee;
            break;
        }

        case Flee: {
            qDebug() << "Flee";
            if (m_mana >= m_weapon->getManaCost()) {
                state = Attack;
            } else {
                if (m_playerCoord->x() >= m_coord.x()) {
                    stopRight();
                    goLeft();
                } else {
                    stopLeft();
                    goRight();
                }
            }
            break;
        }

        case Walk: {
            qDebug() << "Walk";
            if (canAttack()) {
                state = Attack;
            } else {
                QRandomGenerator qrg;
                if (qrg.generate() % 70 == 0) {
                    if (m_goingLeft) {
                        stopLeft();
                        goRight();
                    } else if (m_goingRight){
                        stopRight();
                        goLeft();
                    }
                }
            }
            break;
        }
    }
    return Character::update();
}
