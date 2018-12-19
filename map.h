#ifndef MAP_H
#define MAP_H

#include <QRect>
#include <QVector>
#include <QMap>

class Map {
    public:
        bool isFilled(const qint32 &x, const qint32 &y) const;
        bool isFilled(const QPoint &p) const;
        bool isFilled(const QRect &r) const;
        void fillRectangle(qint32 x1, qint32 y1, qint32 width, qint32 height);

        void addMarkedPoint(QString name, QPoint *point);
        QPoint getMarkedPoint(QString name);
    private:
        QVector<QRect> m_rects;
        QMap<QString, QPoint*> m_markedPoints;
};

#endif // MAP_H
