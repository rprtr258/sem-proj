#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include "world.h"

#include <QOpenGLWidget>
#include <QKeyEvent>

class MainWindow : public QOpenGLWidget {
    public:
        MainWindow(QWidget *parent = nullptr);
        ~MainWindow() override;

        void keyPressEvent(QKeyEvent *event) override;
        void keyReleaseEvent(QKeyEvent *event) override;
        void paint(QPainter *painter, QPaintEvent *event, int elapsed);

    public slots:
        void animate();

    private:
        void paintEvent(QPaintEvent *event) override;

    private:
        World *world;
        int elapsed;
        QBrush background;
};

#endif // MAINWINDOW_H
