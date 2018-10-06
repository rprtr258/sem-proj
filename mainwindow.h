#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QOpenGLWidget>
#include <QKeyEvent>
#include <QPen>

class MainWindow : public QOpenGLWidget {
    public:
        MainWindow(QWidget *parent = nullptr);
        void keyPressEvent(QKeyEvent *event) override;
        void keyReleaseEvent(QKeyEvent *event) override;
        void paint(QPainter *painter, QPaintEvent *event, int elapsed);
        void move(int dx);

    public slots:
        void animate();

    private:
        void paintEvent(QPaintEvent *event) override;

    private:
        int elapsed;
        QBrush background;
        QBrush circleBrush;
        QPen circlePen;
        int x;
        int speed;
};

#endif // MAINWINDOW_H
